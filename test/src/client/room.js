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

var Promise = require('promise')
var assert = require('assert')
var utils = require('./utils.js')

describe('frankly.Client room at ' + utils.getHost(), function () {
  it('create, read, update, delete rooms on Frankly server', function (done) {
    utils.forEachClient({ role: 'admin' }, {
      connect: function () {
        var client = this.client
        var done = this.done

        function create (room) {
          return new Promise(function (resolve, reject) {
            client
              .createRoom(room)
              .then(function (other) {
                assert.strictEqual(typeof other.id, 'number')
                assert.strictEqual(other.status, room.status)
                assert.strictEqual(other.title, room.title)
                assert.strictEqual(other.description, room.description)
                resolve(other)
              })
              .catch(reject)
          })
        }

        function read (room) {
          return new Promise(function (resolve, reject) {
            client.readRoom(room.id).then(function (other) {
              assert.strictEqual(other.id, room.id)
              assert.strictEqual(other.status, room.status)
              assert.strictEqual(other.title, room.title)
              assert.strictEqual(other.description, room.description)
              resolve(other)
            }).catch(reject)
          })
        }

        function update (room) {
          return new Promise(function (resolve, reject) {
            client.updateRoom(room.id, { title: 'Meh...', status: 'active' }).then(function (other) {
              assert.strictEqual(other.id, room.id)
              assert.strictEqual(other.status, 'active')
              assert.strictEqual(other.title, 'Meh...')
              assert.strictEqual(other.description, room.description)
              resolve(other)
            }).catch(reject)
          })
        }

        function del (room) {
          return client.deleteRoom(room.id)
        }

        function success () {
          client.close()
          done()
        }

        function failure (e) {
          client.close()
          done(e)
        }

        create({
          status: 'unpublished',
          title: 'Hoth',
          description: 'A very very cold room...',
        })
          .then(read)
          .then(update)
          .then(del)
          .then(success)
          .catch(failure)
      }
    }, done)
  })
})
