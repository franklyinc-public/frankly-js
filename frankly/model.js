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

  { match: ['rooms', '*', 'owners', '*'],
    build: buildRoomOwner },

  { match: ['rooms', '*', 'moderators', '*'],
    build: buildRoomModerator },

  { match: ['rooms', '*', 'members', '*'],
    build: buildRoomMember },

  { match: ['rooms', '*', 'verifiedusers', '*'],
    build: buildRoomVerifiedUser },

  { match: ['rooms', '*', 'count'],
    build: buildRoomCount },

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
  return {
    type: 'app',
    app:  payload,
  }
}

function buildRoom(path, payload) {
  return {
    type: 'room',
    room: payload,
  }
}

function buildRoomMessage(path, payload) {
  return {
    type:    'room-message',
    room:    { id: parseInt(path[1]) },
    message: payload,
  }
}

function buildRoomCount(path, payload) {
  return {
    type:  'room-count',
    room:  { id: parseInt(path[1]) },
    count: payload,
  }
}

function buildRoomParticipant(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-participant',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomSubscriber(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-subscriber',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomOwner(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-owner',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomModerator(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-moderator',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomMember(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-member',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildRoomVerifiedUser(path, payload) {
  if (!payload) {
    payload = { id: parseInt(path[3]) }
  }

  return {
    type: 'room-verified-user',
    room: { id: parseInt(path[1]) },
    user: payload,
  }
}

function buildUser(path, payload) {
  return {
    type: 'user',
    user: payload,
  }
}

function buildUserBan(path, payload) {
  return {
    type: 'user-ban',
    user: { id: parseInt(path[1]) },
    ban:  payload,
  }
}

function buildSession(path, payload) {
  return {
    type:    'session',
    session: payload,
  }
}

module.exports = {
  build: build,
  match: match,
}
