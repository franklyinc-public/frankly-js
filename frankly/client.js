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

var _cloneDeep = require('lodash/lang/cloneDeep.js')
var WsBackend = require('./wsbackend.js')
var Connection = require('./connection.js')
var message = require('./message.js')
var fileHelper = require('./file.js')

/**
 * This class provides the implementation of a network client that exposes
 * operations available on the Frankly API to a python application.
 *
 * A typical work flow is to create an instance of Client, using it to
 * authenticate and then make method calls to interact with the API.
 * Reusing the same client instance multiple times allows the application to avoid
 * wasting time re-authenticating before every operation.
 *
 * An application can create multiple instances of this class and authenticate
 * with the same or different pairs of appKey and appSecret.
 *
 * Each instance of Client maintains its own connection pool to Frankly
 * servers, if the client is not required anymore then the application should
 * call the close method to release system resources.
 *
 * @constructor Client
 *
 * @param {string} address
 *   The address of the remote server for the chat application.
 *
 * @param {object} timeout
 *   Values that specify how long the client should wait before timing out. Available
 *   properties are 'connect' and 'request', with value in milliseconds.
 *
 * @param {integer} timeout.connect
 *   The length of time the client should wait after trying to connect before timing out,
 *   specified in milliseconds. If the connect property is not set, client will use default value.
 *
 * @param {integer} timeout.request
 *   The length of time the client should wait after trying to make a request before timing out,
 *   specified in milliseconds. If the request property is not set, client will use default value.
 *   
 */
function Client (address, timeout) {
  switch (typeof address) {
    case 'undefined':
      address = 'https://app.franklychat.com'
      break

    case 'string':
      address = makeAddress(address)
      break

    default:
      throw new Error('remote server address must be a string')
  }

  switch (typeof timeout) {
    case 'undefined':
      timeout = { connect: 5000, request: 5000 }
      break

    case 'object':
      if (timeout.connect === undefined) {
        timeout.connect = 5000
      }
      if (timeout.request === undefined) {
        timeout.request = 5000
      }
      break

    default:
      throw new Error('timeout parameter must be an object like { connect: ..., request: ... }')
  }

  Connection.call(this, address, timeout)
}

function makeAddress (address) {
  switch (address) {
    case 'https' : return 'https://app.franklychat.com'
    case 'wss'   : return 'wss://app.franklychat.com'
  }

  if (address.indexOf('https:') === 0) {
    return address
  }

  if (address.indexOf('wss:') === 0) {
    return address
  }

  if (address.indexOf('http:') === 0) {
    return address
  }

  if (address.indexOf('ws:') === 0) {
    return address
  }

  throw new Error("the given address doesn't tell what protocol to use: " + address)
}

Client.prototype = Object.create(Connection.prototype)

Client.prototype.constructor = Client

/**
 * This method exposes a generic interface for reading objects from the Frankly API.
 * Every read* method is implemented on top of this one.
 *
 * @param {string} path
 *   A path to the resource that will be fetched.
 *
 * @param {object} params
 *   Parameters passed as part of the request.
 *
 * @param {object} payload
 *   Payload passed as part of the request.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched data or the reject callback will be called
 *   with an instance of {Error}.
 */
Client.prototype.read = function (path, params, payload) {
  return this.request(0, path, params, payload)
}

/**
 * Retrieves an announcement object with id sepecified as first argument from
 * the app.
 *
 * @param {integer} announcementId
 *   The identifier of the announcement to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched announcement or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readAnnouncement = function (announcementId) {
  return this.read(['announcements', announcementId])
}

/**
 * Retrieves a list of announcements available in the app.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched announcement list or the reject callback
 *   will be called with an instance of {Error}.
 */
Client.prototype.readAnnouncementList = function () {
  return this.read(['announcements'])
}

/**
 * Retrieves the list of rooms that an annoucement has been published to.
 *
 * @param {integer} announcementId
 *   The identifier of the announcement to get the list of rooms for.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readAnnouncementRoomList = function (announcementId) {
  return this.read(['announcements', annoucementId, 'rooms'])
}

/**
 * Retrives an app object with id specified as first argument.
 *
 * @param {integer} appId
 *   The identifier of the app to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched app or the reject callback will be
 *   called with an instance of {Error}.
 */
Client.prototype.readApp = function (appId) {
  return this.read(['apps', appId])
}

/**
 * Retrieves a room object with id specified as first argument from the app.
 *
 * @param {integer} roomId
 *   The identifier of the room to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room or the reject callback will be
 *   called with an instance of {Error}.
 */
Client.prototype.readRoom = function (roomId) {
  return this.read(['rooms', roomId])
}

/**
 * Retrieves the list of all available rooms from the app.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomList = function () {
  return this.read(['rooms'])
}

/**
 * Retrieves the number of online/subscribed/active users in the room.
 * <br/>
 * The fetched object is an object with three fields set:
 * <ul>
 * <li><code>online</code>The number of users currently in the room.
 * <li><code>subscribed</code>The number of users who have subscribed to the room.
 * <li><code>active</code>The number of users who are either onlin or subscribed.
 * </ul>
 * <em>Currently room counters are not computed on demand but refresh at regular
 * intervals.</em>
 *
 * @params {integer} roomId
 *   The id of the room to fetch counters from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched counters or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomCount = function (roomId) {
  return this.read(['rooms', roomId, 'count'])
}

/**
 * Retrieves a spcified message within a given object.
 *
 * @param {integer} roomId
 *   The identifier of the room that message belongs to.
 *   
 * @param {integer} messageId
 *   The identifier of the message to be retrieved.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched message within the specified room or the reject 
 *   callback will be called with an instance of {Error}.
 */

Client.prototype.readRoomMessage = function (roomId, messageId) {
  return this.read(['rooms', roomId, 'messages', messageId])
}

/**
 * Retrieves messages in a room.
 *
 * @param {integer} roomId
 *   The identifier of the room to fetch messages from.
 *
 * @param {object} options
 *   A set of options set to filter which messages we want to receive from
 *   the specified room.
 *
 * @param {integer} options.offset
 *   The id of the message to consider as starting offset for the query.
 *   If the offset is not specified the server will use the id of the most
 *   recent message.
 *
 * @param {integer} options.limit
 *   How many messages at most will be received by the call. The server may
 *   choose to send a lower count if that value exceeds the maximum allowed or
 *   if there are less than the requested number of messages available.
 *   If the limit is not set the server will use a default limit instead, which
 *   means there is no way to retrieve the entire list of messages in a room
 *   (because that could potentially be millions of entries).
 *
 * @param {boolean} options.sticky
 *   When set to true only sticky messages will be returned in the result
 *   list.
 *   When set to false only non-sticky messages will be returned in the
 *   result list. This argument may be omitted or set to None, in that case any
 *   kind of messages will be returned in the result list.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomMessageList = function (roomId, options) {
  return this.read(['rooms', roomId, 'messages'], options)
}

/**
 * Retrieves the list of online users.
 *
 * @params {integer} roomId
 *   The identifier of the room to fetch participants from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched user list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomParticipantList = function (roomId) {
  return this.read(['rooms', roomId, 'participants'])
}

/**
 * Retrieves the list of subscribed users.
 *
 * @params {integer} roomId
 *   The identifier of the room to fetch participants from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room subscriber list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomSubscriberList = function (roomId) {
  return this.read(['rooms', roomId, 'subscribers'])
}

Client.prototype.readRoomOwnerList = function (roomId) {
  return this.read(['rooms', roomId, 'owners'])
}

Client.prototype.readRoomModeratorList = function (roomId) {
  return this.read(['rooms', roomId, 'moderators'])
}

Client.prototype.readRoomMemberList = function (roomId) {
  return this.read(['rooms', roomId, 'members'])
}

/**
 * Retrieves the list of room announcers.
 *
 * @params {integer} roomId
 *   The identifier of the room to fetch room announcers from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room announcer list or the reject callback will
 *   be called with an instance of {Error}.
 */
Client.prototype.readRoomAnnouncerList = function (roomId) {
  return this.read(['rooms', roomId, 'announcers'])
}

Client.prototype.readSession = function () {
  return this.read(['session'])
}

/**
 * Retrieves a user object with id specified as first argument from the app.
 *
 * @params {integer} userId
 *   The identifier of the user to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched user or the reject callback while
 *   be called with an instance of {Error}.
 */
Client.prototype.readUser = function (userId) {
  return this.read(['users', userId])
}

/**
 * Retrieves ban status of the user with id specified.
 *
 * @params {integer} userId
 *   The identifier of the user to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the banned status of the user or the reject callback while
 *   be called with an instance of {Error}.
 */
Client.prototype.readUserBan = function (userId) {
  return this.read(['users', userId, 'ban'])
}

/**
 * Retrieves the activity information for the specified app.
 *
 * @params {integer} appId
 *   The identifier of the app to fetch activity information from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the unread message counts for the specified app or the
 *   reject callback will be called with an instance of {Error}.
 */
Client.prototype.readAppActivity = function (appId) {
  return this.read(['apps', appId, 'activity'])
}

/**
 * Retrieves the activity information for the specified room.
 *
 * @params {integer} roomId
 *   The identifier of the room to fetch activity information from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the unread message counts for the specified room or the
 *   reject callback will be called with an instance of {Error}.
 */
Client.prototype.readRoomActivity = function (roomId) {
  return this.read(['rooms', roomId, 'activity'])
}

/**
 * This method exposes a generic interface for creating objects through the Frankly API.
 * Every create* method is implemented on top of this one.
 *
 * @param {string} path
 *   A path to the collection where a new resource will be created.
 *
 * @param {object} params
 *   Parameters passed as part of the request.
 *
 * @param {object} payload
 *   Payload passed as part of the request.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created data or the reject callback will
 *   be called with an instance of {Error}.
 *
 */
Client.prototype.create = function (path, params, payload) {
  return this.request(1, path, params, payload)
}

/**
 * Creates a new announcement object in the app.
 *
 * @param {object} options
 *   The properties of the the announcement to be created.
 *
 * @param {Array} options.contents
 *   A list of content objects representing what will be embedded into the messages
 *   once the announcement is published to one or more rooms.
 *
 * @param {boolean} options.sticky
 *   Whether the announcement should be published as a sticky or regular messages.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created announcement or the reject callback
 *   will be called with an instance of {Error}.
 *
 */
Client.prototype.createAnnouncement = function (options) {
  return this.create(['announcements'], undefined, options)
}

/**
 * Creates a new room object in the app and return that object.
 * The properties of that new room are given an object to the method.
 *
 * @param {object} options
 *   The properties to set on the newly created room.
 *
 * @param {string} options.title
 *   The title associated to this room.
 *
 * @param {string} options.status
 *   One of 'unpublished', 'active' or 'inactive'.
 *
 * @param {string} options.description
 *   A description of what this chat room is intended for, it is usually a short
 *   description of topics that are discussed by participants.
 *
 * @param {string} options.avatarImageUrl
 *   The URL of an image to use when the room is displayed in one of the mobile
 *   or web apps embedding a Frankly SDK.
 *
 * @param {string} options.featuredImageUrl
 *   The URL of an image to use when the room is featured in one of the mobile
 *   or web apps embedding a Frankly SDK.
 *
 * @param {boolean} options.featured
 *   Whether the room should be featured in the mobile or web apps embedding a Frankly SDK.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created room or the reject callback
 *   will be called with an instance of {Error}.
 *
 */
Client.prototype.createRoom = function (options) {
  return this.create(['rooms'], undefined, options)
}

/**
 * Creates a new message object in the room with id specified as first argument.
 * <br/>
 * The properties of that new message are given as an object to the method.
 *
 * @param {integer} roomId
 *   The identifier of the room to create a message in.
 *
 * @param {object} options
 *   The properties to set on the newly created message.
 *
 * @param {Array} [options.contents]
 *   A list of content objects representing what will be embedded into the messages
 *   once the announcement is published to one or more rooms.
 *
 * @param {integer} [options.announcement]
 *   The identifier of the announcement object created via createAnnouncement.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created message or the reject callback
 *   will be called with an instance of {Error}.
 *
 */
Client.prototype.createRoomMessage = function (roomId, options) {
  var params = undefined

  options = _cloneDeep(options)

  if (options.contents){
    options.contents = message.cloneContentsWithMetadata(options.contents)
  }

  if (options.announcement !== undefined) {
    params = options
    options = undefined
  }

  return this.create(['rooms', roomId, 'messages'], params, options)
}

/**
 * Flags a message identified by the pair of a room and message id.
 *
 * @param {integer} roomId
 *   The identifier of the room which the flagged message belong to.
 *
 * @param {integer} messageId
 *   The identifier of the message to flag.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {Error}.
 *
 */
Client.prototype.createRoomMessageFlag = function (roomId, messageId) {
  return this.create(['rooms', roomId, 'messages', messageId, 'flag'])
}

/**
 * Sets user to be listening for real-time signals on a room.<br/>
 * After a successful call to this method the client will start emitting events
 * for real-time changes to the room but it will not be counted as online and
 * will not be listed as one of the participants.
 *
 * @param {integer} roomId
 *   The identifier of the room which the listener will fire events from.
 *
 * @param {integer} messageId
 *   The identifier of the user to set as listener.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {Error}.
 *
 */
Client.prototype.createRoomListener = function (roomId, userId) {
  return this.create(['rooms', roomId, 'listeners', userId])
}

/**
 * Adds a user as a participant of a room. If the call is successful the client
 * will start receiving pushes for real-time signals on that room.
 *
 * @param {integer} roomId
 *   The identifier of the room which the user will receive signals from.
 *
 * @param {integer} userId
 *   The identifier of the user to set as participant.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {Error}.
 *
 */
Client.prototype.createRoomParticipant = function (roomId, userId) {
  return this.create(['rooms', roomId, 'participants', userId])
}

/**
 * Adds a user as a subscriber of a room. If the call is successful the client
 * will start receiving pushes for real-time signals on that room.
 *
 * @param {integer} roomId
 *   The identifier of the room which the user will receive signals from.
 *
 * @param {integer} userId
 *   The identifier of the user to set as subscriber.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {Error}.
 *
 */
Client.prototype.createRoomSubscriber = function (roomId, userId) {
  return this.create(['rooms', roomId, 'subscribers', userId])
}

Client.prototype.createRoomOwner = function (roomId, userId) {
  return this.create(['rooms', roomId, 'owners', userId])
}

Client.prototype.createRoomModerator = function (roomId, userId) {
  return this.create(['rooms', roomId, 'moderators', userId])
}

Client.prototype.createRoomMember = function (roomId, userId) {
  return this.create(['rooms', roomId, 'members', userId])
}

/**
 * Adds a user as an announcer of a room. User will be able to
 * send sticky messages within that room
 *
 * @param {integer} roomId
 *   The identifier of the room which the user will be an announcer of.
 *
 * @param {integer} userId
 *   The identifier of the user to set as an announcer.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {Error}.
 *
 */
Client.prototype.createRoomAnnouncer = function (roomId, userId) {
  return this.create(['rooms', roomId, 'announcers', userId])
}

Client.prototype.createUser = function (options) {
  return this.create(['users'], undefined, options)
}

/**
 * Creates a new file object on Frankly servers and returns that object.
 * The properties of that new file are given as keyword arguments to the method.
 *
 * @param {object} options
 *   The properties to set on the newly created file.
 *
 * @param {string} options.category
 *   One of the file categories supported by the API (see the *File* section of
 *   the documentation).
 *
 * @param {string} options.type
 *   One of the file types supported by the API (see the *File* section of the
 *   documentation).
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created file or the reject callback
 *   will be called with an instance of {Error}.
 *
 */
Client.prototype.createFile = function (options) {
  return this.create(['files'], undefined, options)
}

/**
 * This method exposes a generic interface for updating objects through the Frankly API.
 * Every update* method is implemented on top of this one.
 *
 * @param {Array} path
 *   The path to the object that will be updated.
 *
 * @param {object} params
 *   Parameters passed as part of the request.
 *
 * @param {object} payload
 *   Payload passed as part of the request.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the returned data or the reject callback will be called
 *   with an instance of {Error}.
 *
 */
Client.prototype.update = function (path, params, payload) {
  return this.request(2, path, params, payload)
}

/**
 * Updates a room object. This call supports partial updates, allowing any
 * number of properties of the room object to be updated at a time.
 *
 * @param {integer} roomId
 *   The identifier to the room object that will be updated.
 *
 * @param {object} options
 *   The set of properties to update on the room.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the updated room or the reject callback will be called
 *   with an instance of {Error}.
 *
 */
Client.prototype.updateRoom = function (roomId, options) {
  return this.update(['rooms', roomId], undefined, options)
}

/**
 * Updates a user object. This call supports partial updates, allowing any
 * number of properties of the user object to be updated at a time.
 *
 * @param {integer} userId
 *   The identifier to the user object that will be updated.
 *
 * @param {object} options
 *   The set of properties to update on the room.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the updated user or the reject callback will be called
 *   with an instance of {Error}.
 *
 */
Client.prototype.updateUser = function (userId, options) {
  return this.update(['users', userId], undefined, options)
}

/**
 * Updates the content of a file object hosted on Frankly servers.
 *
 * @param {string} url
 *   The properties to set on the newly created message.
 *
 * @param {Buffer | ArrayBuffer | Blob} file
 *   A Buffer object in node js environment, or an ArrayBuffer or a Blob object in browsers
 *   providing the new content of the file.
 *
 * @returns {Promise}
 *   The method returns a Promise where the reject callback will be called with an instance
 *   of {Error}.
 *
 */
Client.prototype.updateFile = function (url, file) {
  var self = undefined
  var i = url.indexOf('/files/')
  var path = url.slice(i > -1 ? i : 0).split('/').slice(1)

  if (this.backendClass === WsBackend) {
    self = this
    return this.create(['files', 'token'], undefined, { url: url }).then(function (token) {
      return fileHelper.updateWithToken(self.address, path, token, file)
    })
  } else {
    return this.update(path, undefined, file)
  }
}

/**
 * This method exposes a generic interface for deleting objects through the Frankly API.
 * Every delete* method is implemented on top of this one.
 *
 * @param {Array} path
 *   The path to the object that will be deleted.
 *
 * @param {object} params
 *   Parameters passed as part of the request.
 *
 * @param {object} payload
 *   Payload passed as part of the request.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the returned data or the reject callback will be called
 *   with an instance of {Error}.
 *
 */
Client.prototype.del = function (path, params, payload) {
  return this.request(3, path, params, payload)
}

/**
 * Deletes an announcement object with id sepecified as first argument from the app.
 *
 * <p>
 * <em>Note that deleting an announcement doesn't remove messages from rooms it
 * has already been published to.</em>
 * </p>
 *
 * This operation cannot be undone!
 *
 * @param {integer} announcementId
 *   The identifier of the announcement to delete.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of {Error}.
 *
 */
Client.prototype.deleteAnnouncement = function (announcementId) {
  return this.del(['announcements', announcementId])
}

/**
 * Deletes a room object with id specified as first argument from the app.
 *
 * <p>
 * <em>Note that this will cause all messages sent to this room to be deleted
 * as well, a safer approach could be to change the room status to 'unpublished'
 * to hide it without erasing data.</em>
 * </p>
 *
 * This operation cannot be undone!
 *
 * @param {integer} roomId
 *   The identifier of the room to delete.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of {Error}.
 *
 */
Client.prototype.deleteRoom = function (roomId) {
  return this.del(['rooms', roomId])
}

/**
 * Deletes a listener from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a listener will be removed.
 *
 * @param {integer} userId
 *   The identifier of the user to remove as a listener.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of {Error}.
 *
 */
Client.prototype.deleteRoomListener = function (roomId, userId) {
  return this.del(['rooms', roomId, 'listeners', userId])
}

/**
 * Deletes a participant from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a participant will be removed.
 *
 * @param {integer} userId
 *   The identifier of the user to remove as a participant.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of {Error}.
 *
 */
Client.prototype.deleteRoomParticipant = function (roomId, userId) {
  return this.del(['rooms', roomId, 'participants', userId])
}

/**
 * Deletes a subscriber from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a subscriber will be removed.
 *
 * @param {integer} userId
 *   The identifier of the user to remove as a subscriber.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of {Error}.
 *
 */
Client.prototype.deleteRoomSubscriber = function (roomId, userId) {
  return this.del(['rooms', roomId, 'subscribers', userId])
}

Client.prototype.deleteRoomOwner = function (roomId, userId) {
  return this.del(['rooms', roomId, 'owners', userId])
}

Client.prototype.deleteRoomModerator = function (roomId, userId) {
  return this.del(['rooms', roomId, 'moderators', userId])
}

Client.prototype.deleteRoomMember = function (roomId, userId) {
  return this.del(['rooms', roomId, 'members', userId])
}

Client.prototype.deleteRoomAnnouncer = function (roomId, userId) {
  return this.del(['rooms', roomId, 'announcers', userId])
}

Client.prototype.deleteSession = function () {
  return this.del(['session'])
}

Client.prototype.deleteUser = function (userId) {
  return this.del(['users', userId])
}

module.exports = Client

/**
 * This should be the first method called on an instance of Client. After
 * succesfully returning, the client can be used to interact with the Frankly API.
 *
 * @method Client#open
 *
 * @param {...object} args
 *
 * @param {function} args.generateIdentityToken
 *   When a single argument is provided to the method it is expected to be a
 *   callback to a function that would generated an identity token like
 *   {@link frankly.generateIdentityToken}.
 *
 * @param {string} args.appKey
 *   When two or more arguments are specified the first one is the key that
 *   specifies which app this client is authenticating for, this value is
 *   provided by the Frankly Console.
 *
 * @param {string} args.appSecret
 *   The secret value associated the the key allowing the client to securely
 *   authenticate against the Frankly API.
 *
 * @throws {TypeError}
 *   If the type of arguments is invalid.
 *
 * @throws {Error}
 *   If the number of arguments is invalid.
 *
 * @fires Client#open
 * @fires Client#authenticate
 * @fires Client#connect
 * @fires Client#disconnect
 * @fires Client#error
 */

/**
 * Shuts down all connections and releases system resources held by this client
 * object.
 *
 * @method Client#close
 *
 * @fires Client#close
 */

/**
 * Open event, fired when the {@link Client#open} method is called.
 *
 * @event Client#open
 * @type {undefined}
 */

/**
 * Authentication event, fired when the client successfully authenticates
 * against the Frankly API.
 *
 * @event Client#authenticate
 * @type {object}
 */

/**
 * Connection event, fired when the client successfully establish a
 * connection to a Frankly server.
 *
 * @event Client#connect
 * @type {undefined}
 */

/**
 * Disconnection event, fired when the client gets disconnected from a
 * Frankly server it had previously established a connection to.
 *
 * @event Client#disconnect
 * @type {object}
 *
 * @property {integer} code
 *   The code explaining the cause of the disconnection.
 *
 * @property {string} reason
 *   A human-readable explanation of what caused the disconnection.
 */

/**
 * Object fetching event, fired when the client fetches an object through the Frankly API.
 *
 * @event Client#read
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object creation event, fired when the client creates an object throught the Frankly API.
 *
 * @event Client#create
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object update event, fired when the client updates an object or when an update is made
 * by an external action on an object the client is listening (message sends for example).
 *
 * @event Client#update
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object deletion event, fired when the client deletes an object or when an object is
 * deleted by an external action (participants leaving a room for example).
 *
 * @event Client#delete
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Error event, fired whenever an error is detected on an operation peformed
 * by the client.
 *
 * @event Client#error
 * @type {Error}
 */

/**
 * Close event, fired when the {@link Client#close} method is called.
 *
 * @event Client#close
 * @type {boolean}
 * @property {boolean} hasError
 *   Set to true if the client was closed due to an error.
 */
