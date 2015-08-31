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

var _forEach = require('lodash/collection/forEach')
var _map = require('lodash/collection/map')
var Request = require('./request.js')

function RequestStore () {
  this.requests = { }
}

RequestStore.prototype.store = function (packet, expire, resolve, reject) {
  this.requests[packet.id] = new Request(packet, expire, resolve, reject)
}

RequestStore.prototype.load = function (packet) {
  var key = packet.id
  var map = this.requests
  var req = map[key]

  if (req !== undefined) {
    delete map[key]
  }

  return req
}

RequestStore.prototype.timeout = function (now) {
  var map = this.requests
  var exp = []

  _forEach(map, function (req, key) {
    if (req.expire !== undefined && req.expire <= now) {
      delete map[key]
      exp.push(req)
      try {
        req.timeout()
      } catch (e) {
        console.log(e)
      }
    }
  })

  return exp
}

RequestStore.prototype.cancel = function () {
  return _map(this.requests, function (req) {
    try {
      req.cancel()
    } catch (e) {
      console.log(e)
    }
    return req
  })
}

RequestStore.prototype.each = function (callback) {
  _forEach(this.requests, callback)
}

module.exports = RequestStore
