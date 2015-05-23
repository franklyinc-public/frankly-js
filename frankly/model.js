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

var matchBuild = [
  { match: ['rooms', '*', 'messages', '*'],
    build: buildRoomMessage },

  { match: ['rooms', '*', 'participants', '*'],
    build: buildRoomParticipant },

  { match: ['rooms', '*', 'subscribers', '*'],
    build: buildRoomSubscriber },

  { match: ['rooms', '*'],
    build: buildRoom },

  { match: ['users', '*', 'ban'],
    build: buildUserBan },

  { match: ['users', '*'],
    build: buildUser },

  { match: ['apps', '*'],
    build: buildApp },

  { match: ['session'],
    build: buildSession },
]

function build(path, payload) {
  var key = undefined

  for (key in matchBuild) {
    key = matchBuild[key]

    if (match(path, key.match)) {
      return key.build(path, payload)
    }
  }
}

function match(path, refp) {
  var i = undefined
  var p = undefined
  var r = undefined

  if (path.length !== refp.length) {
    return false
  }

  for (i in refp) {
    r = refp[i]
    p = path[i]

    if (r === '*') {
      continue
    }

    if (r === p) {
      continue
    }

    return false
  }

  return true
}

function buildApp(path, payload) {
  return { type: 'app', app: payload }
}

function buildRoom(path, payload) {
  return { type: 'room', room: payload }
}

function buildRoomMessage(path, payload) {
  return {
    type:    'message',
    room:    { id: parseInt(path[1]) },
    message: payload,
  }
}

function buildRoomParticipant(path, payload) {
  return {
    type: 'participant',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomSubscriber(path, payload) {
  return {
    type: 'subscriber',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildUser(path, payload) {
  return { type: 'user', user: payload }
}

function buildUserBan(path, payload) {
  return {
    type: 'ban',
    user: { id: parseInt(path[1]) },
    ban:  payload,
  }
}

function buildSession(path, payload) {
  return { type: 'session', session: payload }
}

module.exports = {
  build: build,
  match: match,
}
