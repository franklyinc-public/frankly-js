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

var DEFAULT_CONNECT_TIMEOUT = 5000
var DEFAULT_REQUEST_TIMEOUT = 5000

var Connection = require('./connection.js')

/**
 * This class provides the implementation of a network client that exposes
 * operations available on the Frankly API to a python application.
 *
 * A typical work flow is to create an instance of FranklyClient, using it to
 * authenticate and then make method calls to interact with the API.
 * Reusing the same client instance multiple times allows the application to avoid
 * wasting time re-authenticating before every operation.
 *
 * An application can create multiple instances of this class and authenticate
 * with the same or different pairs of appKey and appSecret.
 *
 * Each instance of FranklyClient maintains its own connection pool to Frankly
 * servers, if the client is not required anymore then the application should
 * call the close method to release system resources.
 *
 * @constructor FranklyClient
 */
function FranklyClient(address, timeout) {
  switch (typeof address) {
  case 'undefined':
    address = 'https://app.franklychat.com'
    break

  case 'string':
    break

  default:
    throw new Error("remote server address must be a string")
  }

  switch (typeof timeout) {
  case 'undefined':
    timeout = { connect: DEFAULT_CONNECT_TIMEOUT, request: DEFAULT_REQUEST_TIMEOUT }
    break

  case 'object':
    if (timeout.connect === undefined) {
      timeout.connect = DEFAULT_CONNECT_TIMEOUT
    }
    if (timeout.request === undefined) {
      timeout.request = DEFAULT_REQUEST_TIMEOUT
    }
    break

  default:
    throw new Error("timeout parameter must be an object like { connect: ..., request: ... }")
  }

  Connection.call(this, address, timeout)
}

FranklyClient.prototype = Object.create(Connection.prototype)

FranklyClient.prototype.constructor = FranklyClient

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
 *   with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.read = function (path, params, payload) {
  assertDefined(path)
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
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readAnnouncement = function (announcementId) {
  assertDefined(arguments)
  return this.read('/announcements/' + announcementId)
}

/**
 * Retrieves a list of announcements available in the app.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched announcement list or the reject callback
 *   will be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readAnnouncementList = function () {
  assertDefined(arguments)
  return this.read('/announcements')
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
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readAnnouncementRoomList = function (announcementId) {
  assertDefined(arguments)
  return this.read('/announcements/' + annoucementId + '/rooms')
}

/**
 * Retrives an app object with id specified as first argument.
 *
 * @param {integer} appId
 *   The identifier of the app to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fectched app or the reject callback while be
 *   called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readApp = function (appId) {
  assertDefined(arguments)
  return this.read('/apps/' + appId)
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
 *   called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoom = function (roomId) {
  assertDefined(arguments)
  return this.read('/rooms/' + roomId)
}

/**
 * Retrieves the list of all available rooms from the app.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room list or the reject callback will
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoomList = function () {
  assertDefined(arguments)
  return this.read('/rooms')
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
 *   object representing the fectched counters or the reject callback while
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoomCount = function (roomId) {
  assertDefined(arguments)
  return this.read('/rooms/' + roomId + '/count')
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
 * @param {boolean} options.contextual
 *   When set to true only contextual messages will be returned in the result
 *   list.
 *   When set to false only non-contextual messages will be returned in the
 *   result list. This argument may be omitted or set to None, in that case any
 *   kind of messages will be returned in the result list.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fetched room list or the reject callback will
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoomMessageList = function (roomId, options) {
  assertDefined(arguments)
  return this.read('/rooms/' + roomId + '/messages', options)
}

/**
 * Retrives the list of online users.
 *
 * @params {integer} roomId
 *   The identifer of the room to fetch participants from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fectched user list or the reject callback while
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoomParticipantList = function (roomId) {
  assertDefined(arguments)
  return this.read('/rooms/' + roomId + '/participants')
}

/**
 * Retrieves the list of subscribed users.
 *
 * @params {integer} roomId
 *   The identifer of the room to fetch participants from.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fectched user list or the reject callback while
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readRoomSubscriberList = function (roomId) {
  assertDefined(arguments)
  return this.read('/rooms/' + roomId + '/subscribers')
}

/**
 * Retrieves a user object with id specified as first argument from the app.
 *
 * @params {integer} userId
 *   The identifer of the user to fetch.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the fectched user or the reject callback while
 *   be called with an instance of {@link FranklyError}.
 */
FranklyClient.prototype.readUser = function (userId) {
  assertDefined(arguments)
  return this.read('/users/' + userId)
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
 *   be called with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.create = function (path, params, payload) {
  assertDefined(path)
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
 * @param {boolean} options.contextual
 *   Whether the announcement should be published as a contextual or regular messages.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created announcement or the reject callback
 *   will be called with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createAnnouncement = function (options) {
  assertDefined(arguments)
  return this.create('/announcements', undefined, options)
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
 * @param {string} options.avatar_image_url
 *   The URL of an image to use when the room is displayed in one of the mobile
 *   or web apps embedding a Frankly SDK.
 *
 * @param {string} options.featured_image_url
 *   The URL of an image to use when the room is featured in one of the mobile
 *   or web apps embedding a Frankly SDK.
 *
 * @param {boolean} options.featured
 *   Whether the room should be featured in the mobile or web apps embedding a Frankly SDK.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created room or the reject callback
 *   will be called with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoom = function (options) {
  assertDefined(arguments)
  return this.create('/rooms', undefined, options)
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
 * @param {Array} options.contents
 *   A list of content objects representing what will be embedded into the messages
 *   once the announcement is published to one or more rooms.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive an
 *   object representing the newly created message or the reject callback
 *   will be called with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoomMessage = function (roomId, options) {
  var params = undefined

  assertDefined(arguments)

  if (options.announcement !== undefined) {
    params  = options
    options = undefined
  }

  return this.create('/rooms/' + roomId + '/messages', params, options)
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
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoomMessageFlag = function (roomId, messageId) {
  assertDefined(arguments)
  return this.create('/rooms/' + roomId + '/messages/' + messageId + '/flag')
}

/**
 * Sets user to be listening for real-time signals on a room.<br/>
 * After a sucessful call to this method the client will start emitting events
 * for real-time changes to the room but it will not be counted as online and
 * will not be listed as one of the participants.
 *
 * @param {integer} roomId
 *   The identifier of the room which the flagged message belong to.
 *
 * @param {integer} messageId
 *   The identifier of the user to set as listener.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoomListener = function (roomId, userId) {
  assertDefined(arguments)
  return this.create('/rooms/' + roomId + '/listeners/' + userId)
}

/**
 * Adds a user as a participant of a room. If the call is successful the client
 * will start receiving pushes for real-time signals on that room.
 *
 * @param {integer} roomId
 *   The identifier of the room which the flagged message belong to.
 *
 * @param {integer} userId
 *   The identifier of the user to set as participant.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoomParticipant = function (roomId, userId) {
  assertDefined(arguments)
  return this.create('/rooms/' + roomId + '/participants/' + userId)
}

/**
 * Adds a user as a subscriber of a room. If the call is successful the client
 * will start receiving pushes for real-time signals on that room.
 *
 * @param {integer} roomId
 *   The identifier of the room which the flagged message belong to.
 *
 * @param {integer} userId
 *   The identifier of the user to set as subscriber.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#create
 * @fires FranklyClient#error
 */
FranklyClient.prototype.createRoomSubscriber = function (roomId, userId) {
  assertDefined(arguments)
  return this.create('/rooms/' + roomId + '/subscribers/' + userId)
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
 *   with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#update
 * @fires FranklyClient#error
 */
FranklyClient.prototype.update = function (path, params, payload) {
  assertDefined(path)
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
 *   with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#update
 * @fires FranklyClient#error
 */
FranklyClient.prototype.updateRoom = function (roomId, options) {
  assertDefined(arguments)
  return this.update('/rooms/' + roomId, undefined, options)
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
 *   with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#update
 * @fires FranklyClient#error
 */
FranklyClient.prototype.updateUser = function (userId, options) {
  assertDefined(arguments)
  return this.update('/users/' + userId, undefined, options)
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
 *   with an instance of {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.del = function (path, params, payload) {
  assertDefined(path)
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
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.deleteAnnouncement = function (announcementId) {
  assertDefined(arguments)
  return this.del('/announcements/' + announcementId)
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
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.deleteRoom = function (roomId) {
  assertDefined(arguments)
  return this.del('/rooms/' + roomId)
}

/**
 * Deletes a listener from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a listener will be removed.
 *
 * @param {integer} userId
 *   The identifer of the user to remove as a listener.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.deleteRoomListener = function (roomId, userId) {
  assertDefined(arguments)
  return this.del('/rooms/' + roomId + '/listeners/' + userId)
}

/**
 * Deletes a participant from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a participant will be removed.
 *
 * @param {integer} userId
 *   The identifer of the user to remove as a participant.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.deleteRoomParticipant = function (roomId, userId) {
  assertDefined(arguments)
  return this.del('/rooms/' + roomId + '/participants/' + userId)
}

/**
 * Deletes a subscriber from a room.
 *
 * @param {integer} roomId
 *   The identifier of the room where a subscriber will be removed.
 *
 * @param {integer} userId
 *   The identifer of the user to remove as a subscriber.
 *
 * @returns {Promise}
 *   The method returns a Promise where the resolve callback will receive a null
 *   object or the reject callback will be called with an instance of
 *   {@link FranklyError}.
 *
 * @fires FranklyClient#delete
 * @fires FranklyClient#error
 */
FranklyClient.prototype.deleteRoomSubscriber = function (roomId, userId) {
  assertDefined(arguments)
  return this.del('/rooms/' + roomId + '/subscribers/' + userId)
}

module.exports = FranklyClient

function assertDefined(args) {
  var offset = undefined

  switch (typeof args) {
  case 'undefined':
    throw new Error("argument at position 1 must not be undefined")

  case 'object':
    for (offset in args) {
      if (args[offset] === undefined) {
        throw new Error("argument at position " + (parseInt(offset) + 1) + " must not be undefined")
      }
    }
  }
}

/**
 * This should be the first method called on an instance of FranklyClient. After
 * succesfully returning, the client can be used to interact with the Frankly API.
 *
 * @method FranklyClient#open
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
 * @fires FranklyClient#open
 * @fires FranklyClient#authenticate
 * @fires FranklyClient#connect
 * @fires FranklyClient#disconnect
 * @fires FranklyClient#error
 */

/**
 * Shuts down all connections and releases system resources held by this client
 * object.
 *
 * @method FranklyClient#close
 *
 * @fires FranklyClient#close
 */

/**
 * Open event, fired when the {@link FranklyClient#open} method is called.
 *
 * @event FranklyClient#open
 * @type {undefined}
 */

/**
 * Authentication event, fired when the client successfully authenticates
 * against the Frankly API.
 *
 * @event FranklyClient#authenticate
 * @type {object}
 */

/**
 * Connection event, fired when the client sucessfully establish a
 * connection to a Frankly server.
 *
 * @event FranklyClient#connect
 * @type {undefined}
 */

/**
 * Disconnection event, fired when the client gets disconnected from a
 * Frankly server it had previously established a connection to.
 *
 * @event FranklyClient#disconnect
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
 * @event FranklyClient#read
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object creation event, fired when the client creates an object throught the Frankly API.
 *
 * @event FranklyClient#create
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object update event, fired when the client updates an object or when an update is made
 * by an external action on an object the client is listening (message sends for example).
 *
 * @event FranklyClient#update
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Object deletion event, fired when the client deletes an object or when an object is
 * deleted by an external action (participants leaving a room for example).
 *
 * @event FranklyClient#delete
 * @type {object}
 * @property {string} type
 *   The event type which represent what kind of data is carried.
 */

/**
 * Error event, fired whenever an error is detected on an operation peformed
 * by the client.
 *
 * @event FranklyClient#error
 * @type {FranklyError}
 */

/**
 * Close event, fired when the {@link FranklyClient#close} method is called.
 *
 * @event FranklyClient#close
 * @type {boolean}
 * @property {boolean} hasError
 *   Set to true if the client was closed due to an error.
 */
