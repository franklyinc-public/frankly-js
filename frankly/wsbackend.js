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

var WebSocket   = require('ws')
var qs          = require('querystring')
var url         = require('url')
var Cookie      = require('./Cookie.js')
var Packet      = require('./packet.js')
var runtime     = require('./runtime.js')
var normalize   = require('./normalize.js')
var denormalize = require('./denormalize.js')

function WsBackend(address, session) {
  WebSocket.call(this, makeURL(address, session), 'chat')

  this.on('message', function (data, flags) {
    var packet = undefined

    if (!flags.binary) {
      this.close(1000, "non-binary frame received from the server")
      return
    }

    if (flags.masked) {
      this.close(1000, "masked frame received from the server")
      return
    }

    // When run in Node.js the ws module produces Buffer instances for binary
    // messages instead of ArrayBuffer.
    if (data.toArrayBuffer !== undefined) {
      data = data.toArrayBuffer()
    } else {
      data = new Uint8Array(data)
    }

    try {
      packet = Packet.decode(data)
      packet.params  = normalize(packet.params)
      packet.payload = normalize(packet.payload)
    } catch (e) {
      this.close(1000, "failed to decode packet received from server")
      return
    }

    this.emit('packet', packet)
  })
}

WsBackend.prototype = Object.create(WebSocket.prototype)

WsBackend.prototype.constructor = WsBackend

if (runtime.browser) {
  // When used in the browser the WebSocket.send function accepts Uint8Array
  // instances produced by Packet.encode.
  WsBackend.prototype.send = function (packet) {
    packet.params  = denormalize(packet.params)
    packet.payload = denormalize(packet.payload)
    WebSocket.prototype.send.call(this, Packet.encode(packet))
  }
} else {
  // When used in Node.js the WebSocket.send function from the ws module only
  // accepts Buffer instances.
  // This causes an extra memory copy but client requests being pretty small
  // it shouldn't have any impact on performance.
  WsBackend.prototype.send = function (packet) {
    packet.params  = denormalize(packet.params)
    packet.payload = denormalize(packet.payload)
    WebSocket.prototype.send.call(this, new Buffer(Packet.encode(packet)), { binary: true })
  }
}

function makeURL(address, session) {
  var u = url.parse(address)
  var c = undefined

  switch (u.protocol) {
  case 'ws:':
  case 'wss:':
    break

  default:
    throw new Error("websocket connection cannot be establish to " + address)
  }

  if (session.identityToken) {
    // On safari cross-domain requests and iframes don't send cookies, for this
    // browser we establish the websocket connection by passing the identity token
    // directly with the handshake.
    u.pathname = session.path
    u.query = { identity_token: session.identityToken }
  }

  else if (session.xsrf) {
    // If the xsrf value is set on the session then we're run from a browser
    // or something simulating it, we set the prefix to the path cookies should
    // have been set for so they get sent with the HTTP handshake.
    u.pathname = session.path + '/a/' + session.app.id + '/u/' + session.user.id + '/s/' + session.seed
    u.query = { xsrf: session.xsrf }
  }

  else if (session.cookies) {
    // If cookies are available we're being run as a client that was authenticated
    // from generating an identity token, because websocket libraries don't support
    // cookies we pass those values in the query string.
    u.pathname = session.path + '/'
    u.query = { }
    c = Cookie.get(session.cookies, 'app-token')

    if (c !== undefined) {
      u.query.token = c.value
    }
  }

  else {
    // In any other case we assume that we're run from a Node.js backend that
    // is providing the app key and secret so no pre-authentication was done.
    // We simply set all the required query parameters so that HTTP handshake
    // will pass authentication.
    u.pathname = session.path + '/'
    u.query = { }

    if (session.app.key !== undefined) {
      u.query.app_key = session.app.key
    }

    if (session.app.secret !== undefined) {
      u.query.app_secret = session.app.secret
    }

    if (session.user.id !== undefined) {
      u.query.app_user_id = session.user.id
    }

    if (session.role !== undefined) {
      u.query.app_user_role = session.role
    }
  }

  u.search = qs.stringify(u.query)
  return url.format(u)
}

module.exports = WsBackend
