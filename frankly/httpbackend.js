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
var url = require('url')
var Packet = require('./packet.js')
var Cookie = require('./cookie.js')
var http = require('./http.js')

function HttpBackend (address, session) {
  var self = this
  var u = undefined
  var i = undefined
  var c = undefined

  EventEmitter.call(this)
  u = url.parse(address)

  switch (u.protocol) {
    case 'http:':
    case 'https:':
      break

    default:
      throw new Error('http connection cannot be established to ' + address)
  }

  this.closed = false
  this.path = session.path
  this.headers = { }
  this.host = u.hostname
  this.port = u.port
  this.protocol = u.protocol

  if (session.identityToken) {
    // This authentication scheme is not supported for http requests.
    throw new Error("HTTP requests don't support authentication through an identity token")
  }

  else if (session.xsrf) {
    // If the xsrf value is set on the session then we're run from a browser
    // or something simulating it, we set the prefix to the path cookies should
    // have been set for so they get sent with HTTP requests.
    this.path += '/a/' + session.app.id + '/u/' + session.user.id + '/s/' + session.seed
    this.headers['frankly-app-xsrf'] = session.xsrf
  }

  else if (session.cookies) {
    // If cookies are available we're run as a client that was authenticated from
    // generating an identity token, all we need to do is set these cookies back
    // in each HTTP request submitted.
    c = Cookie.get(session.cookies, 'app-token')

    if (c !== undefined) {
      this.headers['cookie'] = [Cookie.format(c)]
    }
  } else {
    // In any other case we assume that we're run from a Node.js backend that
    // is providing the app key and secret so no pre-authentication was done.
    // We simply set all the required headers so that HTTP requests can be
    // authenticated individually.
    if (session.app.key !== undefined) {
      this.headers['frankly-app-key'] = session.app.key
    }

    if (session.app.secret !== undefined) {
      this.headers['frankly-app-secret'] = session.app.secret
    }

    if (session.user.id !== undefined) {
      this.headers['frankly-app-user-id'] = session.user.id
    }

    if (session.role !== undefined) {
      this.headers['frankly-app-user-role'] = session.role
    }
  }

  // Simulate the connection establishment that happens on websocket backends.
  setTimeout(function () {
    if (!self.closed) {
      self.emit('open')
    }
  }, 1)
}

HttpBackend.prototype = Object.create(EventEmitter.prototype)

HttpBackend.prototype.constructor = HttpBackend

HttpBackend.prototype.send = function (packet) {
  var self = this
  var path = this.path + '/' + packet.path.join('/')
  var method = makeMethod(packet.type)

  if (this.closed) {
    throw new Error('http backend was already closed')
  }

  // Transforms a packet request into a HTTP request, when the promise gets
  // resolved or rejected we emit an event simulating an asynchronous response
  // packet.
  http.request({
    method: method,
    path: path,
    headers: this.headers,
    host: this.host,
    port: this.port,
    protocol: this.protocol,
  }, packet.payload)
    .then(function (res) {
      self.emit('packet', new Packet(0, packet.seed, packet.id, packet.path, packet.params, res.content))
    })
    .catch(function (error) {
      self.emit('packet', new Packet(1, packet.seed, packet.id, packet.path, packet.params, {
        status: error.status,
        error: error.reason,
      }))
    })
}

HttpBackend.prototype.close = function (code, reason) {
  if (!this.closed) {
    this.closed = true
    this.emit('close', code, reason)
  }
}

function makeMethod (type) {
  switch (type) {
    case 0: return 'GET'
    case 1: return 'POST'
    case 2: return 'PUT'
    case 3: return 'DELETE'
    default:
      throw new TypeError('invalid packet type: ' + type)
  }
}

function makePath (prefix, path) {
  return prefix + '/' + path.join('/')
}

module.exports = HttpBackend
