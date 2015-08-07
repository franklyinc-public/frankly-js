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

function WS(url, proto) {
  var self = this

  EventEmitter.call(this)

  this.ws = new WebSocket(url, proto)
  this.ws.binaryType = 'arraybuffer'

  this.ws.onopen = function (event) {
    self.emit('open', event)
  }

  this.ws.onclose = function (event) {
    self.emit('close', event)
  }

  this.ws.onmessage = function (event) {
    var data  = event.data
    var flags = { }

    switch (typeof data) {
    case 'string':
      flags = { binary: false, masked: false }

    default:
      flags = { binary: true, masked: false }
    }

    self.emit('message', data, flags)
  }
}

WS.prototype = Object.create(EventEmitter.prototype)

WS.prototype.constructor = WS

WS.prototype.ws = undefined

WS.prototype.close = function (code, reason) {
  this.ws.onopen = undefined
  this.ws.onclose = undefined
  this.ws.onmessage = undefined
  this.ws.close(code, reason)
  this.emit('close', { code: code, reason: reason })
}

WS.prototype.send = function (data, flags) {
  this.ws.send(data)
}

module.exports = WS
