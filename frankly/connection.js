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
var authenticate = require('./authenticate.js')
var jwt          = require('./jwt.js')
var model        = require('./model.js')
var Packet       = require('./packet.js')
var Socket       = require('./socket.js')
var RequestStore = require('./requeststore.js')
var FranklyError = require('./error.js')

function Connection(address, timeout) {
  EventEmitter.call(this)
  this.pending = new RequestStore()
  this.address = address
  this.timeout = timeout
  this.session = undefined
  this.socket  = undefined
  this.timer   = undefined
  this.running = false
  this.idseq   = 1
  this.version = 1
}

Connection.prototype = Object.create(EventEmitter.prototype)

Connection.prototype.constructor = Connection

Connection.prototype.open = function () {
  var generateIdentityToken = undefined
  var appKey    = undefined
  var appSecret = undefined
  var options   = undefined
  var self      = this

  if (this.running) {
    throw new Error("open was called multiple times on the same client before it was closed")
  }

  switch (arguments.length) {
  case 1:
    generateIdentityToken = arguments[0]

    if (typeof generateIdentityToken !== 'function') {
      throw new TypeError("the constructor argument must be a function")
    }

    break

  case 2:
    appKey    = arguments[0]
    appSecret = arguments[1]

    if (typeof appKey !== 'string') {
      throw new TypeError("the constructor's first argument must be a string")
    }

    if (typeof appSecret !== 'string') {
      throw new TypeError("the constructor's second argument must be a string")
    }

    generateIdentityToken = jwt.identityTokenGenerator(appKey, appSecret)
    break

  case 3:
    appKey    = arguments[0]
    appSecret = arguments[1]
    options   = arguments[2]

    if (typeof appKey !== 'string') {
      throw new TypeError("the constructor's first argument must be a string")
    }

    if (typeof appSecret !== 'string') {
      throw new TypeError("the constructor's second argument must be a string")
    }

    generateIdentityToken = jwt.identityTokenGenerator(appKey, appSecret, options)
    break

  default:
    throw new Error("invalid argument count for open(function) or open(string, string)")
  }

  this.running = true
  this.timer = setInterval(function () { pulse(self) }, 1000)
  this.emit('open')
  start(this, this.version, generateIdentityToken)
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
    this.emit('error', new FranklyError(req.operation(), req.packet.path, 500, "the request got canceled"))
  }

  if (this.socket !== undefined) {
    try {
      this.socket.close()
    } catch (e) {
      console.log(e)
    } finally {
      this.socket = undefined
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

Connection.prototype.nextid = function () {
  var id = this.idseq
  this.idseq = id + 1
  return id
}

Connection.prototype.request = function (type, path, params, payload) {
  var packet  = undefined
  var seed    = undefined
  var self    = this
  var timeout = this.timeout.request

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
    this.nextid(),
    splitPath(path),
    params,
    payload
  )

  return new Promise(function (resolve, reject) {
    if (!self.running) {
      reject(new FranklyError(type, path, 400, "submitting request before opening is not allowed"))
      return
    }

    self.pending.store(packet, Date.now() + timeout, resolve, function (e) {
      if (e.status === 401 && self.version === packet.version && self.socket !== undefined) {
        try {
          self.socket.close()
        } catch (e) {
          console.log(e)
        }
      }
      reject(e)
    })

    if (self.socket !== undefined) {
      packet.version = self.version
      packet = packet.clone()
      packet.seed = 0
      self.socket.send(packet)
    }
  })
}

function start(self, version, generateIdentityToken, delay) {
  if (version !== self.version) {
    return
  }

  function success(session) {
    if (version !== self.version) {
      return
    }

    if (self.session !== undefined && self.session.seed !== session.seed) {
      self.idseq = 1
    }

    self.session = session
    self.emit('authenticate', session)
    connect(self, version, generateIdentityToken)
  }

  function failure(error) {
    if (version !== self.version) {
      return
    }

    error.operation = 'authenticate'
    self.emit('error', error)

    switch (error.status) {
    case 400:
    case 401:
    case 403:
      self.close(true)
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
      start(self, version, generateIdentityToken, delay)
    }, delay)
  }

  function auth() {
    if (version !== self.version) {
      return
    }

    authenticate(self.address, generateIdentityToken, { timeout: self.timeout.request })
      .then(success)
      .catch(failure)
  }

  function reauth() {
    var session = self.session
    var timeout = self.timeout.request

    if (version !== self.version) {
      return
    }

    http.get({ host: self.address, path: makeHttpQuery(session, '/auth'), timeout: timeout })
      .then(function (res) {
        if (res.statusCode !== 200) {
          self.session = undefined
          auth()
        } else {
          success(res.content)
        }
      })
      .catch(failure)
  }

  if (self.session !== undefined) {
    reauth()
  } else {
    auth()
  }
}

function connect(self, version, generateIdentityToken) {
  var session = self.session
  var ready   = false
  var socket  = undefined

  if (version !== self.version) {
    return
  }

  socket = new Socket(self.address + makeHttpQuery(session, '/'))

  socket.on('open', function () {
    if (!ready && version === self.version) {
      ready = true
      self.socket = socket
      self.emit('connect')
      self.pending.each(function (req) {
        var packet = undefined

        req.packet.version = self.version
        packet = req.packet.clone()

        if (packet.seed === 0) {
          req.packet.seed = self.session.seed
        }

        if (packet.seed === self.session.seed) {
          packet.seed = 0
        }

        socket.send(packet)
      })
    } else {
      socket.close()
    }
  })

  socket.on('close', function (code, reasonse) {
    if (!ready && version === self.version) {
      ready = true
      self.socket = undefined
      self.emit('disconnect', { code: code, reason: reason })
      start(self, version, generateIdentityToken)
    }
  })

  socket.on('packet', function (packet) {
    if (version === self.version) {
      if (packet.seed === 0) {
        packet.seed = self.session.seed
      }

      if (packet.id !== 0) {
        handleResponse(self, packet)
      } else {
        handleSignal(self, packet)
      }
    }
  })

  setTimeout(function() {
    if (!ready && version === self.version) {
      ready = true
      self.emit('error', new FranklyError('connect', '/', 408, "connection timed out"))
      socket.close()
      start(self, version, generateIdentityToken)
    }
  }, self.timeout.connect)
}

function pulse(self) {
  var exp = self.pending.timeout(Date.now())
  var key = undefined
  var req = undefined

  for (key in exp) {
    req = exp[key]
    self.emit('error', new FranklyError(req.operation(), req.packet.path, 408, "the request timed out"))
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
      data = model.build(path, data)

      if (data === undefined) {
        return
      }

      switch (req.packet.type) {
      case 0:
        self.emit('read', data)
        break

      case 1:
        self.emit('create', data)
        break

      case 2:
        self.emit('update', data)
        break

      case 3:
        self.emit('delete', data)
        break
      }

      return

    case 1:
      err = new FranklyError(req.operation(), path, data.status, data.error)
      break

    default:
      err = new FranklyError(req.operation(), path, 500, "the server responded with an invalid packet type [" + type + "]")
      break
    }

    req.reject(err)
    self.emit('error', err)
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

function splitPath(path) {
  var list1 = path.split('/')
  var list2 = [ ]
  var value = undefined
  var index = undefined

  for (index in list1) {
    value = list1[index]

    if (value.length !== 0) {
      list2.push(value)
    }
  }

  return list2
}

module.exports = Connection
