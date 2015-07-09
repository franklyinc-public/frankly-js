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

var Error = require('./error.js')

function Request(packet, expire, resolve, reject) {
  this.packet  = packet
  this.expire  = expire
  this.resolve = resolve
  this.reject  = reject
}

Request.prototype.timeout = function () {
  var type = this.packet.type
  var path = this.packet.path
  this.reject(Error.make(operation(type), path, 408, "the request timed out"))
}

Request.prototype.cancel = function () {
  var type = this.packet.type
  var path = this.packet.path
  this.reject(Error.make(operation(type), path, 500, "the request got canceled"))
}

Request.prototype.operation = function () {
  return operation(this.packet.type)
}

function operation(type) {
  switch (type) {
  case 0:  return 'read'
  case 1:  return 'create'
  case 2:  return 'update'
  case 3:  return 'delete'
  default: return 'unknown'
  }
}

Request.operation = operation

module.exports = Request
