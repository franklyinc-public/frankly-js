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

describe('frankly.Client message at ' + utils.getHost(), function () {
  var admin = undefined
  var room = undefined

  before(function (done) {
    admin = utils.deferOpenWsClient({ role: 'admin' })

    admin.on('connect', function () {
      admin.createRoom({
        status: 'active',
        title: 'Hi!',
      }).then(function (r) {
        room = r
        done()
      }).catch(done)
    })
  })

  describe('basic', function () {
    it('create and read messages', function (done) {
      utils.forEachClient({ uid: 1, role: 'regular' }, {
        connect: function () {
          var client = this.client
          var done = this.done

          function createMessage (room) {
            return new Promise(function (resolve, reject) {
              client.createRoomMessage(room.id, {
                contents: [
                  { type: 'text/plain', value: 'Hello World!' },
                ],
              }).then(function (message) {
                assert.strictEqual(typeof message.id, 'number')
                assert.strictEqual(message.contents.length, 1)
                assert.strictEqual(message.contents[0].type, 'text/plain')
                assert.strictEqual(message.contents[0].value, 'Hello World!')
                resolve({ room: room, message: message })
              }).catch(reject)
            })
          }

          function readMessage (object) {
            return new Promise(function (resolve, reject) {
              client.readRoomMessageList(object.room.id)
                .then(function (messages) {
                  messages = messages.filter(function (m) { return m.id === object.message.id })
                  assert.strictEqual(messages.length, 1)
                  assert.strictEqual(messages[0].id, object.message.id)
                  assert.strictEqual(messages[0].type, object.message.type)
                  assert.strictEqual(messages[0].value, object.message.value)
                  resolve()
                }).catch(reject)
            })
          }

          function success () {
            client.close()
            done()
          }

          function failure (e) {
            client.close()
            done(e)
          }

          createMessage(room)
            .then(readMessage)
            .then(success)
            .catch(failure)
        }
      }, done)
    })
  })

  describe('error handling', function () {
    it("don't allow invalid message", function (done) {
      utils.forEachClient({ uid: 1, role: 'regular'}, {
        connect: function () {
          var client = this.client
          var done = this.done

          client.createRoomMessage(room.id, {
            contents: [{
              type: 'text/plain'
            }]
          }).then(function () {
            done(new Error('this request has invalid format, but succeeded'))
          })
            .catch(function (error) {
              assert.strictEqual(error.status, 400)
              done()
            })
        }
      }, done)
    })

    it("don't allow invalid sticky message", function (done) {
      utils.forEachClient({ role: 'admin' }, {
        connect: function () {
          var client = this.client
          var done = this.done

          client.createRoomMessage(room.id, {
            sticky: true,
            contents: [{
              type: 'text/plain'
            }]
          }).then(function () {
            done(new Error('this request has invalid format, but succeeded'))
          })
            .catch(function (error) {
              assert.strictEqual(error.status, 400)
              done()
            })
        }
      }, done)
    })
  })

  describe('real time', function () {
    it('send messages between two clients', function (done) {
      var user1 = utils.deferOpenWsClient({ uid: 1, role: 'regular' })
      var user2 = undefined

      function failure (error) {
        user1.close()
        user2.close()
        done(error)
      }

      user1.on('authenticate', function (session) {
        user1.createRoomParticipant(room.id, session.user.id)
          .then(function () {
            user2 = utils.deferOpenWsClient({ uid: 2, role: 'regular' })

            user2.on('connect', function () {
              user2.createRoomMessage(room.id, {
                contents: [
                  { type: 'text/plain', value: 'How are you?' },
                ],
              }).then(function (message) {
                user2.close()
              }).catch(failure)
            })
          }).catch(failure)
      })

      user1.on('update', function (event) {
        try {
          assert.strictEqual(event.type, 'room-message')
          assert.strictEqual(event.room.id, room.id)
          assert.strictEqual(event.message.contents.length, 1)
          assert.strictEqual(event.message.contents[0].type, 'text/plain')
          assert.strictEqual(event.message.contents[0].value, 'How are you?')
          user1.close()
          done()
        } catch (e) {
          failure(e)
        }
      })
    })
  })

  after(function (done) {
    admin
      .deleteRoom(room.id)
      .then(function () {
        admin.close()
        done()
      })
      .catch(done)
  })
})
