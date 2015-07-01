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
var model  = require('../frankly/model.js')

describe('frankly.Model', function () {
  describe('app', function () {
    it('checks if matching an app model path produces the expected result', function () {
      var obj = model.build(['apps', 42], {
        id: 42,
        name: 'star wars',
      })

      assert.strictEqual(obj.type, 'app')
      assert.strictEqual(obj.app.id, 42)
      assert.strictEqual(obj.app.name, 'star wars')
    })
  })

  describe('session', function () {
    it('checks if matching a session model path produces the expected result', function () {
      var obj = model.build(['session'], {
        app: { id: 1 },
        user: { id: 2 },
        token: 'hello world',
      })

      assert.strictEqual(obj.type, 'session')
      assert.strictEqual(obj.session.app.id, 1)
      assert.strictEqual(obj.session.user.id, 2)
      assert.strictEqual(obj.session.token, 'hello world')
    })
  })

  describe('user', function () {
    it('checks if matching a user model path produces the expected result', function () {
      var obj = model.build(['users', 1234], {
        id: 1234,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'user')
      assert.strictEqual(obj.user.id, 1234)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('user-ban', function () {
    it('checks if matching a user ban model path produces the expected result', function () {
      var obj = model.build(['users', 1234, 'ban'], {
        status: 'unban',
      })

      assert.strictEqual(obj.type, 'user-ban')
      assert.strictEqual(obj.user.id, 1234)
      assert.strictEqual(obj.ban.status, 'unban')
    })
  })

  describe('room', function () {
    it('checks if matching a room model path produces the expected result', function () {
      var obj = model.build(['rooms', 1], {
        id: 1,
        title: 'Hoth',
      })

      assert.strictEqual(obj.type, 'room')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.room.title, 'Hoth')
    })
  })

  describe('room-message', function () {
    it('checks if matching a message model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'messages', 2], {
        id: 2,
        contents: [
          { type: 'text/plain', value: 'Hello World!' },
        ]
      })

      assert.strictEqual(obj.type, 'room-message')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.message.id, 2)
      assert.strictEqual(obj.message.contents.length, 1)
      assert.strictEqual(obj.message.contents[0].type, 'text/plain')
      assert.strictEqual(obj.message.contents[0].value, 'Hello World!')
    })
  })

  describe('room-count', function () {
    it('checks if matching a room count model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'count'], {
        active: 3,
        online: 2,
        subscribed: 1,
      })

      assert.strictEqual(obj.type, 'room-count')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.count.active, 3)
      assert.strictEqual(obj.count.online, 2)
      assert.strictEqual(obj.count.subscribed, 1)
    })
  })

  describe('room-participant', function () {
    it('checks if matching a participant model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'participants', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-participant')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('room-subscriber', function () {
    it('checks if matching a subscriber model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'subscribers', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-subscriber')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('room-owner', function () {
    it('checks if matching a owner model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'owners', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-owner')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('room-moderator', function () {
    it('checks if matching a moderator model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'moderators', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-moderator')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('room-member', function () {
    it('checks if matching a member model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'members', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-member')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('room-verified-user', function () {
    it('checks if matching a verified user model path produces the expected result', function () {
      var obj = model.build(['rooms', 1, 'verifiedusers', 2], {
        id: 2,
        display_name: 'Luke Skywalker',
      })

      assert.strictEqual(obj.type, 'room-verified-user')
      assert.strictEqual(obj.room.id, 1)
      assert.strictEqual(obj.user.id, 2)
      assert.strictEqual(obj.user.display_name, 'Luke Skywalker')
    })
  })

  describe('fail', function() {
    it('checks if matching an invalid path is properly handled', function () {
      var obj = model.build(['something'], { })
      assert.strictEqual(obj, undefined)
    })
  })
})
