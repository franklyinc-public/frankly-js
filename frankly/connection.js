/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Frankly Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
'use strict'

var EventEmitter = require('events').EventEmitter
var Promise      = require('promise')
var url          = require('url')
var authenticate = require('./authenticate.js')
var jwt          = require('./jwt.js')
var model        = require('./model.js')
var Error        = require('./error.js')
var Packet       = require('./packet.js')
var RequestStore = require('./requeststore.js')
var HttpBackend  = require('./httpbackend.js')
var WsBackend    = require('./wsbackend.js')

function Connection(address, timeout) {
  EventEmitter.call(this)
  this.pending = new RequestStore()
  this.address = address
  this.timeout = timeout
  this.session = undefined
  this.backend = undefined
  this.timer   = undefined
  this.args    = undefined
  this.running = false
  this.idseq   = 1
  this.version = 1
  this.backendClass = undefined
}

Connection.prototype = Object.create(EventEmitter.prototype)

Connection.prototype.constructor = Connection

Connection.prototype.open = function () {
  var args = undefined
  var self = this

  if (this.running) {
    throw new Error("open was called multiple times on the same client before it was closed")
  }

  switch (arguments.length) {
  case 1:
    args = { generateIdentityToken: arguments[0] }

    if (typeof args.generateIdentityToken !== 'function') {
      throw new TypeError("the constructor argument must be a function")
    }

    break

  case 2:
    args = {
      appKey    : arguments[0],
      appSecret : arguments[1],
      options   : { },
    }

    if (typeof args.appKey !== 'string') {
      throw new TypeError("the constructor's first argument must be a string")
    }

    if (typeof args.appSecret !== 'string') {
      throw new TypeError("the constructor's second argument must be a string")
    }

    break

  case 3:
    args = {
      appKey    : arguments[0],
      appSecret : arguments[1],
      options   : arguments[2],
    }

    if (typeof args.appKey !== 'string') {
      throw new TypeError("the constructor's first argument must be a string")
    }

    if (typeof args.appSecret !== 'string') {
      throw new TypeError("the constructor's second argument must be a string")
    }

    break

  default:
    throw new Error("invalid argument count for open(function) or open(string, string)")
  }

  this.args    = args
  this.running = true
  this.timer   = setInterval(function () { pulse(self) }, 1000)
  this.emit('open')

  switch (url.parse(this.address).protocol) {
  case 'ws:':
  case 'wss:':
    this.backendClass = WsBackend
    start(this, this.version + 1, 1000)
    break

  case 'http:':
  case 'https:':
  default:
    this.backendClass = HttpBackend
    start(this, this.version + 1, 1000)
    break
  }
}

Connection.prototype.close = function (hasError) {
  var exp = undefined
  var key = undefined
  var req = undefined

  if (!this.running) {
    return
  }

  if (hasError === undefined) {
    hasError = false
  }

  clearInterval(this.timer)
  this.running = false
  this.session = undefined
  this.timer   = undefined
  this.version = this.version + 1

  exp = this.pending.cancel()

  for (key in exp) {
    req = exp[key]
    this.emit('error', Error.make(req.operation(), req.packet.path, 500, "the request got canceled"))
  }

  if (this.backend !== undefined) {
    try {
      this.backend.close(1000, "")
    } catch (e) {
      console.log(e)
    } finally {
      this.backend = undefined
    }
  }

  this.emit('close', hasError)
}

Connection.prototype.emit = function () {
  try {
    EventEmitter.prototype.emit.apply(this, arguments)
  } catch (e) {
    console.log(e)
  }
}

Connection.prototype.request = function (type, path, params, payload) {
  var packet  = undefined
  var seed    = undefined
  var self    = this
  var version = this.version
  var timeout = this.timeout.request

  if (!self.running) {
    throw new Error("submitting request before opening is not allowed")
  }

  if (params === undefined) {
    params = null
  }

  if (payload === undefined) {
    payload = null
  }

  if (this.session === undefined) {
    seed = 0
  } else {
    seed = this.session.seed
  }

  packet = new Packet(
    type,
    seed,
    this.idseq++,
    formatPath(path),
    params,
    payload
  )

  return new Promise(function (resolve, reject) {
    self.pending.store(packet, Date.now() + timeout, resolve, function (e) {
      if (e.status === 401 && self.version === version && self.backend !== undefined) {
        self.backend.close(1000, "")
      }
      reject(e)
    })

    if (self.backend !== undefined) {
      packet = packet.clone()
      packet.seed = 0
      self.backend.send(packet)
    }
  })
}

Connection.prototype.reconnect = function () {
  this.disconnect()
  start(this, this.version + 1, 1000)
}

Connection.prototype.disconnect = function () {
  if (this.backend !== undefined) {
    this.backend.close(1000, "")
    this.backend = undefined
  }
}

function start(self, version, delay) {
  var args = self.args

  if (version !== (self.version + 1)) {
    return
  }

  self.version = version

  function success(session) {
    if (version !== self.version) {
      return
    }

    // If an identity token is present in the session object we're probably authenticating
    // on safari or ie10 and we can't tell if authentication was succesful yet.
    // We'll broadcast the 'authenticate' event after fetching the session on the established
    // connection.
    if (session.identityToken === undefined) {
      self.session = session
      self.emit('authenticate', session)
    }

    if (version !== self.version) {
      return
    }

    connect(self, version, delay, session)
  }

  function failure(error) {
    if (version !== self.version) {
      return
    }

    error.operation = 'authenticate'
    self.emit('error', error)

    if (version !== self.version) {
      return
    }

    if (delay === undefined) {
      delay = 1000
    } else {
      delay = delay + 1000
    }

    if (delay > 15000) {
      delay = 15000
    }

    setTimeout(function () {
      start(self, version + 1, delay)
    }, delay)
  }

  if (args.generateIdentityToken === undefined) {
    success({
      app: {
        id     : parseInt(args.appKey.split(args.appKey.indexOf('-'))[0]),
        key    : args.appKey,
        secret : args.appSecret,
      },
      user: {
        id: args.user,
      },
      role: args.role,
      path: '',
    })
  } else {
    authenticate(self.address, args.generateIdentityToken, { timeout: self.timeout.request })
      .then(success)
      .catch(failure)
  }
}

function publish(self, version) {
  var session = self.session
  var pending = self.pending
  var backend = self.backend

  if (self.version !== version) {
    return
  }

  pending.each(function (req) {
    var packet = req.packet.clone()

    if (packet.seed === 0) {
      req.packet.seed = session.seed
    }

    else if (packet.seed === session.seed) {
      packet.seed = 0
    }

    backend.send(packet)
  })
}

function connect(self, version, delay, session) {
  var backend = undefined
  var timeout = undefined

  if (version !== self.version) {
    return
  }

  backend = new self.backendClass(self.address, session)

  if (session.identityToken === undefined) {
    backend.on('open', function () {
      clearTimeout(timeout)

      if (version !== self.version) {
        backend.close(1000, "")
        return
      }

      self.backend = backend
      self.emit('connect')
      publish(self, version)
      return
    })
  } else {
    backend.on('open', function () {
      clearTimeout(timeout)

      if (version !== self.version) {
        backend.close(1000, "")
        return
      }

      // When an identity token was set on the session object authentication was
      // performed during the websocket handshake, to emulate the behavior of the
      // default authentication mechanism we first fetch the current session so
      // it can be published as argument to the 'authenticate' event.
      self.backend = backend
      self.request(0, ['session'])
        .then(function (session) {
          if (self.version !== version) {
            return
          }

          self.session = session
          self.emit('authenticate', session)

          if (self.version !== version) {
            return
          }

          self.emit('connect')
          publish(self, version)
        })
        .catch(function (error) {
          if (self.version !== version) {
            return
          }

          self.emit('error', error)
          start(self, version + 1, delay)
        })
    })
  }

  backend.on('close', function (code, reason) {
    clearTimeout(timeout)

    if (version !== self.version) {
      return
    }

    self.backend = undefined
    self.emit('disconnect', { reconnectAfter: delay })
    start(self, version + 1, delay)
  })

  backend.on('packet', function (packet) {
    if (version !== self.version) {
      return
    }

    if (packet.seed === 0) {
      packet.seed = session.seed
    }

    if (packet.id !== 0) {
      handleResponse(self, packet)
    } else {
      handleSignal(self, packet)
    }
  })

  timeout = setTimeout(function() {
    if (version !== self.version) {
      return
    }

    self.emit('error', Error.make('connect', '/', 408, "connection timed out"))
    start(self, version + 1, delay)
    backend.close(1000, "")
  }, self.timeout.connect)
}

function pulse(self) {
  var exp = self.pending.timeout(Date.now())
  var key = undefined
  var req = undefined

  for (key in exp) {
    req = exp[key]
    req.reject(Error.make(req.operation(), req.packet.path, 408, "the request timed out"))
  }
}

function handleResponse(self, packet) {
  var req  = self.pending.load(packet)
  var err  = undefined
  var path = undefined
  var type = undefined
  var data = undefined

  if (req !== undefined) {
    path = req.packet.path
    type = packet.type
    data = packet.payload

    switch (type) {
    case 0:
      req.resolve(data)
      return

    case 1:
      err = Error.make(req.operation(), path, data.status, data.error)
      break

    default:
      err = Error.make(req.operation(), path, 500, "the server responded with an invalid packet type (" + type + ")")
      break
    }

    req.reject(err)
  }
}

function handleSignal(self, packet) {
  var data = model.build(packet.path, packet.payload)

  if (data !== undefined) {
    switch (packet.type) {
    case 2:
      self.emit('update', data)
      return
    case 3:
      self.emit('delete', data)
      return
    }
  }

  self.emit('signal', packet.type, packet.path, packet.payload)
}

function makeHttpQuery(session, path) {
  if (session.token !== undefined) {
    return path + '?token=' + session.token
  } else {
    return '/a/' + session.app.id + '/u/' + session.user.id + path + '?xsrf=' + session.xsrf
  }
}

function formatPath(path) {
  var index = undefined

  for (index = 0; index != path.length; ++index) {
    path[index] = path[index].toString()
  }

  return path
}

module.exports = Connection
