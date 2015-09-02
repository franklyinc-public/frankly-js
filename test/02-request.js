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
var Promise = require('promise')
var Packet = require('../frankly/packet.js')
var RequestStore = require('../frankly/requeststore.js')

describe('frankly.Request', function () {
  describe('success', function () {
    it('puts a request in a store and completes it with a success', function (done) {
      var rs = new RequestStore()

      new Promise(function (resolve, reject) {
        var packet1 = new Packet(0, 1, 2, ['answer', 42], { }, undefined)
        var packet2 = new Packet(0, 1, 2, null, null, 'Hello World!')
        var timeout = Date.now() + 10
        rs.store(packet1, timeout, resolve, reject)
        rs.load(packet2).resolve(packet2.payload)
      }).then(function (payload) {
        assert.strictEqual(payload, 'Hello World!')
        done()
      }).catch(done)
    })
  })

  describe('failure', function () {
    it('puts a request in a store and completes it with a failure', function (done) {
      var rs = new RequestStore()

      new Promise(function (resolve, reject) {
        var packet1 = new Packet(0, 1, 2, ['answer', 42], { }, undefined)
        var packet2 = new Packet(1, 1, 2, null, null, { status: 400, error: 'something went wrong' })
        var timeout = Date.now() + 10
        rs.store(packet1, timeout, resolve, reject)
        rs.load(packet2).resolve(packet2.data)
      }).then(done).catch(function (error) {
        try {
          assert(error instanceof Error)
          assert.strictEqual(error.operation, 'read')
          assert.strictEqual(error.path, '/answer/42')
          assert.strictEqual(error.status, 400)
          assert.strictEqual(error.reason, 'something went wrong')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  describe('timeout', function () {
    it('puts a request in a store and expires it', function (done) {
      var rs = new RequestStore()

      new Promise(function (resolve, reject) {
        var packet1 = new Packet(0, 1, 2, ['answer', 42], { }, undefined)
        var packet2 = new Packet(0, 1, 2, null, null, 'Hello World!')
        var timeout = Date.now() + 10
        rs.store(packet1, timeout, resolve, reject)
        rs.timeout(Date.now() + 20)
      }).then(done).catch(function (error) {
        try {
          assert(error instanceof Error)
          assert.strictEqual(error.operation, 'read')
          assert.strictEqual(error.path, '/answer/42')
          assert.strictEqual(error.status, 408)
          assert.strictEqual(error.reason, 'the request timed out')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  describe('cancel', function () {
    it('puts a request in a store and cancels it', function (done) {
      var rs = new RequestStore()

      new Promise(function (resolve, reject) {
        var packet1 = new Packet(0, 1, 2, ['answer', 42], { }, undefined)
        var packet2 = new Packet(0, 1, 2, null, null, 'Hello World!')
        var timeout = Date.now() + 10
        rs.store(packet1, timeout, resolve, reject)
        rs.cancel()
      }).then(done).catch(function (error) {
        try {
          assert(error instanceof Error)
          assert.strictEqual(error.operation, 'read')
          assert.strictEqual(error.path, '/answer/42')
          assert.strictEqual(error.status, 500)
          assert.strictEqual(error.reason, 'the request got canceled')
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })
})
