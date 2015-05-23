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

var browser   = typeof WebSocket !== 'undefined'
var WebSocket = require('ws')
var Packet    = require('./packet.js')

function Socket(url, seed) {
  WebSocket.call(this, url, 'chat')

  this.on('message', function (data, flags) {
    var packet = undefined

    if (!flags.binary) {
      this.close(1003, "non-binary frame received from the server")
      return
    }

    if (flags.masked) {
      this.close(1002, "masked frame received from the server")
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
    } catch (e) {
      this.close(1003, "failed to decode packet received from server")
      return
    }

    this.emit('packet', packet)
  })
}

Socket.prototype = Object.create(WebSocket.prototype)

Socket.prototype.constructor = Socket

if (browser) {
  // When used in the browser the WebSocket.send function accepts Uint8Array
  // instances produced by Packet.encode.
  Socket.prototype.send = function (packet) {
    WebSocket.prototype.send.call(this, Packet.encode(packet))
  }
} else {
  // When used in Node.js the WebSocket.send function from the ws module only
  // accepts Buffer instances.
  // This causes an extra memory copy but client requests being pretty small
  // it shouldn't have any impact on performance.
  Socket.prototype.send = function (packet) {
    WebSocket.prototype.send.call(this, new Buffer(Packet.encode(packet)), { binary: true })
  }
}

module.exports = Socket
