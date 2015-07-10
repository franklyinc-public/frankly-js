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
var assert  = require('assert')
var jwt     = require('../frankly/jwt.js')
var Client  = require('../frankly/client.js')

describe('frankly.Client [ws]', function () {
  var appKey    = process.env.FRANKLY_APP_KEY
  var appSecret = process.env.FRANKLY_APP_SECRET
  var appHost   = process.env.FRANKLY_APP_HOST

  if (appHost.indexOf('https') === 0) {
    appHost = 'wss' + appHost.slice(5)
  }

  if (appHost.indexOf('http') === 0) {
    appHost = 'ws' + appHost.slice(4)
  }

  describe('auth', function () {
    it("authenticate a client against a Frankly server running at " + appHost, function (done) {
      var client  = new Client(appHost)
      var auth    = false
      var open    = false
      var connect = false

      client.on('open', function () {
        open = true
      })

      client.on('authenticate', function () {
        auth = true
      })

      client.on('connect', function () {
        connect = true
        client.close()
      })

      client.on('close', function () {
        try {
          assert.strictEqual(auth, true)
          assert.strictEqual(open, true)
          assert.strictEqual(connect, true)
          done()
        } catch (e) {
          done(e)
        }
      })

      client.on('error', done)
      client.open(jwt.identityTokenGenerator(appKey, appSecret, { role: 'admin' }))
    })
  })

  describe('room', function () {
    it("create, read, update, delete rooms on Frankly server running at " + appHost, function (done) {
      var client = new Client(appHost)

      client.on('open', function (session) {
        function create(room) {
          return new Promise(function (resolve, reject) {
            client.createRoom(room).then(function (other) {
              assert.strictEqual(typeof other.id, 'number')
              assert.strictEqual(other.status, room.status)
              assert.strictEqual(other.title, room.title)
              assert.strictEqual(other.description, room.description)
              resolve(other)
            }).catch(reject)
          })
        }

        function read(room) {
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

        function update(room) {
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

        function del(room) {
          return client.deleteRoom(room.id)
        }

        function success() {
          client.close()
          done()
        }

        function failure(e) {
          client.close()
          done(e)
        }

        create({
          status      : 'unpublished',
          title       : 'Hoth',
          description : 'A very very cold room...',
        })
          .then(read)
          .then(update)
          .then(del)
          .then(success)
          .catch(failure)
      })

      client.on('error', done)
      client.open(appKey, appSecret)
    })
  })

  describe('message', function () {
    it("create a room a message on Frankly server running at " + appHost, function (done) {
      var client = new Client(appHost)

      client.on('open', function (session) {
        function createRoom(room) {
          return client.createRoom({
            status      : 'active',
            title       : 'Hoth',
            description : 'A very very cold room...',
          })
        }

        function createMessage(room) {
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

        function readMessage(object) {
          return new Promise(function (resolve, reject) {
            client.readRoomMessageList(object.room.id)
              .then(function (messages) {
                assert.strictEqual(messages.length, 1)
                assert.strictEqual(messages[0].id, object.message.id)
                assert.strictEqual(messages[0].type, object.message.type)
                assert.strictEqual(messages[0].value, object.message.value)
                resolve()
              }).catch(reject)
          })
        }

        function success() {
          client.close()
          done()
        }

        function failure(e) {
          client.close()
          done(e)
        }

        createRoom()
          .then(createMessage)
          .then(readMessage)
          .then(success)
          .catch(failure)
      })

      client.on('error', done)
      client.open(appKey, appSecret)
    })
  })

  describe('chat', function () {
    it("create a room and send messages between two clients on Frankly server at " + appHost, function (done) {
      var admin = new Client(appHost)
      var user1 = new Client(appHost)
      var user2 = new Client(appHost)
      var count = 0
      var room  = undefined

      function failure(error) {
        admin.close()
        user1.close()
        user2.close()
        done(error)
      }

      admin.on('open', function () {
        admin.createRoom({
          status: 'active',
          title:  'Hi!',
        }).then(function (r) {
          room = r
          user1.open(jwt.identityTokenGenerator(appKey, appSecret, { uid: 1 }))
          admin.close()
        }).catch(failure)
      })

      user1.on('authenticate', function (session) {
        user1.createRoomParticipant(room.id, session.user.id)
          .then(function () {
            user2.open(jwt.identityTokenGenerator(appKey, appSecret, { uid: 2 }))

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
          }).catch(failure)
      })

      user2.on('open', function () {
        user2.createRoomMessage(room.id, {
          contents: [
            { type: 'text/plain', value: 'How are you?' },
          ],
        }).then(function (message) {
          user2.close()
        }).catch(failure)
      })

      admin.on('error', failure)
      admin.open(jwt.identityTokenGenerator(appKey, appSecret, { role: 'admin' }))
    })
  })

  describe('user', function () {
    it('authenticates as a user and updates the display name', function (done) {
      var admin = new Client(appHost)

      function success(user) {
        try {
          assert.strictEqual(user.displayName, 'Luke Skywalker')
          done()
        } catch (e) {
          failure(e)
        }
      }

      function failure(err) {
        admin.close()
        done(err)
      }

      admin.on('authenticate', function (session) {
        admin.updateUser(session.user.id, {
          displayName: 'Luke Skywalker',
        })
          .then(success)
          .catch(failure)
      })

      admin.on('error', failure)
      admin.open(jwt.identityTokenGenerator(appKey, appSecret, { role: 'admin' }))
    })
  })
})
