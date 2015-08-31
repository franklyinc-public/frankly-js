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

var mpack = require('mpack-js')
var Encoder = mpack.Encoder
var Decoder = mpack.Decoder

function Packet (type, seed, id, path, params, payload) {
  this.type = type
  this.seed = seed
  this.id = id
  this.path = path
  this.params = params
  this.payload = payload
}

Packet.prototype.key = function () {
  return this.seed + '.' + this.id
}

Packet.prototype.clone = function () {
  return new Packet(this.type, this.seed, this.id, this.path, this.params, this.payload)
}

Packet.encode = function (packet) {
  var encoder = new Encoder()
  var properties = packet.type

  if (packet.seed) {
    properties |= (1 << 6)
  }

  if (packet.id) {
    properties |= (1 << 5)
  }

  properties |= (1 << 4) // skinny bit
  encoder.encode(properties)

  if (packet.seed) {
    encoder.encode(packet.seed)
  }

  if (packet.id) {
    encoder.encode(packet.id)
  }

  encoder.encode(packet.path)
  encoder.encode(packet.params)
  encoder.encode(packet.payload)
  return encoder.flush()
}

Packet.decode = function (bytes) {
  var packet = new Packet()
  var decoder = new Decoder(bytes)
  var properties = decoder.decode()

  packet.type = properties & 0x7
  packet.seed = 0
  packet.id = 0

  if (properties & (1 << 6)) {
    packet.seed = decoder.decode()
  }

  if (properties & (1 << 5)) {
    packet.id = decoder.decode()
  }

  packet.path = decoder.decode()
  packet.params = decoder.decode()
  packet.payload = decoder.decode()
  return packet
}

module.exports = Packet
