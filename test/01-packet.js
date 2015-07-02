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

var assert = require('assert')
var Packet = require('../frankly/packet.js')

describe('franly.Packet', function () {
  describe('READ', function () {
    it('encodes and decodes a read packet', function () {
      var packet = new Packet(
        0,
        1,
        2,
        ['hello', 'world'],
        { 'answer': 42 },
        null
      )

      var bytes = Packet.encode(packet)
      var i = 0
      var k = 0

      packet = Packet.decode(bytes)

      assert(packet.type === 0)
      assert(packet.seed === 1)
      assert(packet.id   === 2)

      assert(packet.path.length === 2)
      assert(packet.path[0] === 'hello')
      assert(packet.path[1] === 'world')

      for (k in packet.params) {
        i++
      }

      assert(i === 1)
      assert(packet.params.answer === 42)
      assert(packet.payload === null)
    })
  })

  describe('CREATE', function () {
    it('encodes and decodes a create packet', function () {
      var packet = new Packet(
        1,
        1,
        2,
        ['hello', 'world'],
        { },
        'How are you doing?'
      )

      var bytes = Packet.encode(packet)
      var i = 0
      var k = 0

      packet = Packet.decode(bytes)

      assert(packet.type === 1)
      assert(packet.seed === 1)
      assert(packet.id   === 2)

      assert(packet.path.length === 2)
      assert(packet.path[0] === 'hello')
      assert(packet.path[1] === 'world')

      for (k in packet.params) {
        i++
      }

      assert(i === 0)
      assert(packet.payload === 'How are you doing?')
    })
  })

  describe('UPDATE', function () {
    it('encodes and decodes an update packet', function () {
      var packet = new Packet(
        2,
        1,
        2,
        ['hello', 'world'],
        { },
        'How are you doing?'
      )

      var bytes = Packet.encode(packet)
      var i = 0
      var k = 0

      packet = Packet.decode(bytes)

      assert(packet.type === 2)
      assert(packet.seed === 1)
      assert(packet.id   === 2)

      assert(packet.path.length === 2)
      assert(packet.path[0] === 'hello')
      assert(packet.path[1] === 'world')

      for (k in packet.params) {
        i++
      }

      assert(i === 0)
      assert(packet.payload === 'How are you doing?')
    })
  })

  describe('DELETE', function () {
    it('encodes and decodes a delete packet', function () {
      var packet = new Packet(
        3,
        0,
        0,
        ['hello'],
        { },
        null
      )

      var bytes = Packet.encode(packet)
      var i = 0
      var k = 0

      packet = Packet.decode(bytes)

      assert(packet.type === 3)
      assert(packet.seed === 0)
      assert(packet.id   === 0)

      assert(packet.path.length === 1)
      assert(packet.path[0] === 'hello')

      for (k in packet.params) {
        i++
      }

      assert(i === 0)
      assert(packet.payload === null)
    })
  })
})
