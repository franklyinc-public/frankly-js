/*!
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

var FranklyClient = require('./frankly/client.js')
var FranklyError  = require('./frankly/error.js')
var jwt           = require('./frankly/jwt.js')

/**
 * @fileOverview
 *
 * <a name="Installation"><h2>Installation</h2></a>
 *
 * <p>
 * The code is publicly available on npm in a module named <a href=""><em>frankly-js</em></a>.
 * </p>
 *
 * <p>
 * <code>$ npm install frankly-js</code>
 * </p>
 *
 * <a name="Goal"><h2>Goal</h2></a>
 *
 * <p>
 * Frankly exposes a REST API to give a higher control to customers over the way
 * they want to use the platform. Most operations available through the Frankly
 * Console can be automated by querying the Frankly API directly.
 * </p>
 *
 * As the API needs to be secure and flexible, a developer needs to master a
 * couple of concepts about how it works in order to take the greatest advantage
 * of it. To make the learning curve smoother and development faster, the frankly
 * module exposes operations available on the API through python methods of a
 * client object.
 *
 * <p>
 * Things like authentication which are redundant and unproductive tasks are
 * nicely abstracted by the module to help developers focus on the core of what
 * they need to get done with the Frankly API.
 * </p>
 *
 * <a name="User"><h2>Usage</h2></a>
 *
 * <p>
 * The sections bellow explain how to use the module to authenticate and query
 * the <strong>Frankly API</strong>.
 * </p>
 *
 * <p>
 * All operations to the API are made from instances of the {@link FranklyClient} class.
 * Those objects expose methods to the application which map to remote procedure
 * calls (RPC) on the <strong>Frankly</strong> servers, they also negotiate and maintain the
 * state required by the API's security policies.
 * </p>
 *
 * Here's how {@link FranklyClient} instances are created:
 * <pre>
 *     var FranklyClient = require('frankly-js').FranklyClient
 *
 *     var client = new FranklyClient()
 * </pre>
 *
 * <a name="Authenticate"><h3>Authentication</h3></a>
 *
 * <p>
 * Before performing any operation (calling any method) the client instance needs
 * to authenticate against Frankly API.
 * The API supports different level of permissions but this module is design to
 * only allow <em>admin</em> authentication.
 * </p>
 *
 * <p>
 * When authenticating as an <em>admin</em> user the client needs to be given the
 * <code>appKey</code> and <code>appSecret</code> values obtained from the
 * <a href="https://console.franklychat.com/">Frankly Console</a>
 * </p>
 *
 * Here's how to perform authentication from a Node.js application:
 * <pre>
 *     var FranklyClient = require('frankly-js').FranklyClient
 *
 *     var appKey    = 'appKey from Frankly Console'
 *     var appSecret = 'appSecret from Frankly Console'
 *
 *     var client = new FranklyClient()
 *     client.open(appKey, appSecret)
 * </pre>
 *
 * <p>
 * When authenticating from a client application running in the browser the
 * <code>appKey</code> and <code>appSecret</code> values shouldn't be exposed
 * and the application's backend servers must generate the identity token using
 * the secret and return it to the client to successfully authenticate.
 * </p>
 *
 * Here's how to perform authentication form a browser application:
 * <pre>
 *     var client = new frankly.FranklyClient
 *
 *     client.open(function (nonce) {
 *         return new Promise(function (resolve, reject) {
 *             var req = new XMLHttpRequest()
 *
 *             req.onreadystatechange = function () {
 *                 if (req.readyState === 4) {
 *                     if (req.stats === 200) {
 *                          resolve(req.responseText)
 *                     } else {
 *                          reject('something went wrong')
 *                     }
 *                 }
 *             }
 *
 *             req.open('https://partner.domain.com/identity-token?nonce=' + nonce)
 *             req.send()
 *         })
 *     })
 * </pre>
 *
 * <p>
 * The client instance automatically performs reconnection and reauthentication when
 * necessary so the method passed to {@link FranklyClient#open} may be called multiple
 * times.
 * </p>
 *
 * <p>
 * <em>Publishing the <code>appSecret</code> value to the public can have security
 * implications and could be used by an attacker to alter the content of an application.</em>
 * </p>
 *
 * <a name="Rooms"><h3>Rooms</h3></a>
 *
 * <p>
 * One of the central concepts in the <strong>Frankly API</strong> is the chat room.
 * An application can create, update and delete chat rooms. A chat room can be
 * seen as a collection of messages, with some associated meta-data like the title,
 * description or avatar image to be displayed when the end users access the mobile
 * or web app embedding a <strong>Frankly SDK</strong>.
 * </p>
 *
 * This code snippet shows how to create chat rooms:
 * <pre>
 *     var FranklyClient = require('frankly-js').FranklyClient
 *
 *     ...
 *
 *     client.createRoom({
 *         title       : 'Hi',
 *         description : 'My First Chat Room',
 *         status      : 'active',
 *     }).then(function (msg) { ... })
 *      .catch(function (err) { ... })
 * </pre>
 *
 * <p>
 * As we can see here, when creating a room the application must specify a *status*
 * property which can be one of the following:
 * </p>
 *
 * <ul>
 * <li>
 * <code>unpublished</code> in this state the room will not be shown to clients
 * fetching the list of available rooms in the app, this is useful if the application
 * needs to create rooms that shouldn't be available yet because they still need to be
 * modified.
 * </li>
 *
 * <li>
 * <code>active</code> in this state the room will be displayed in all clients fetching
 * the list of available rooms that end users can join to start chatting with each other.
 * </li>
 *
 * <li>
 * <code>inactive</code> this last state is an intermediary state between the first two,
 * the room will be part of fetching operations but they will not be displayed in the
 * mobile or web app UI, it is useful for testing purposes.
 * </li>
 * </ul>
 *
 * <a name="Messages"><h3>Messages</h3></a>
 *
 * <p>
 * Frankly being a chat platform it allows applications to send and receive messages.
 * Naturally {@link FranklyClient} instances can publish and fetch messages to chat
 * rooms.
 * </p>
 *
 * This code snippet shows hot to create messages:
 * <pre>
 *     var FranklyClient = require('frankly-js').FranklyClient
 *
 *     ...
 *
 *     client.createRoomMessage(
 *         room.id, {
 *         contents: [{
 *           type  : 'text/plain',
 *           value : 'Hello World!',
 *         }],
 *     }).then(function (msg) { ... })
 *      .catch(function (err) { ... })
 *
 *     client.createRoomMessage(
 *         room.id, {
 *         contents: [{
 *           type : 'image/*',
 *           url  : 'https://app.franklychat.com/files/...',
 *         }]
 *     }).then(function (msg) { ... })
 *      .catch(function (err) { ... })
 * </pre>
 *
 * <p>
 * Let's explain quickly what's happening here: messages published to chat rooms
 * actually support multiple parts, they may contain few text entries, or a text
 * and an image, etc... So the *contents* property is actually a list of objects.
 * Fields of the content objects are:
 * </p>
 *
 * <ul>
 * <li>
 * <code>type</code> which is the mime type of the actual content it represent and gives
 * the application informations about how to render the content. This is mandatory.
 * </li>
 *
 * <li>
 * <code>value</code> which is used for inline resources directly embedded into the message.
 * </li>
 *
 * <li>
 * <code>url</code> which is used for remote resources that the application can upload and
 * download in parallel of sending or receiving messages. On of *value* or *url*
 * must be specified.
 * </li>
 * </ul>
 *
 * <p>
 * Typically, text messages are inlined because they are small enough resources
 * that they can be embedded into the message without impact user experience.
 * Images on the other end may take a while to download and rendering can be
 * optimized using caching mechanisms to avoid downloading large resources too
 * often, that's why they should provided as a remote resource (we'll see later
 * in the *Files* section how to generate remote resource URLs).
 *
 * <p>
 * <em>Keep in mind that messages will be broadcasted to every client application
 * currently listening for messages on the same chat room when they are created.</em>
 * </p>
 *
 * <a name="Announcements"><h3>Announcements</h3></a>
 *
 * <p>
 * Announcements are a different type of messages which are only available to
 * admin users.
 * </br>
 * A client authenticated with admin priviledges can create announcements in the
 * app, which can then be published to one or more rooms at a later time.
 * </p>
 *
 * <p>
 * In mobile and web apps embedding a <strong>Frankly SDK</strong>, announcements are rendered
 * differently from regular messages, they are highlighted and can be forced to
 * stick at the top of the chat room UI to give some context to end users about
 * what is currently ongoing.
 * </p>
 *
 * Here's how an app using the frankly module would create and then publish
 * announcements:
 * <pre>
 *     var FranklyClient = require('frankly-js').FranklyClient
 *
 *     ...
 *
 *     client.createAnnouncement({
 *         contents: [{
 *           type  : 'text/plain',
 *           value : 'Welcome!',
 *         }],
 *     })
 *     .then(function (anno) {
 *         return client.createRoomMessage(room.id, {
 *             announcement: anno.id,
 *         })
 *     })
 *     .then(function (msg) {
 *         ...
 *     })
 *     .catch(function (err) {
 *         ...
 *     })
 * </pre>
 *
 * <p>
 * As we can see here, the announcement is created with the same structure than
 * a regular message.
 * <br/>
 * The content of the announcement is actually what is going to be set as the
 * message content when published to a room and obeys the same rules that were
 * described in the <a href="#Messages">Messages</a> section regarding inline and remote content.
 * </p>
 *
 * @copyright Copyright (c) 2015 Frankly Inc.
 * @license MIT
 * @name frankly
 */
 module.exports = {
   FranklyClient         : FranklyClient,
   FranklyError          : FranklyError,
   generateIdentityToken : jwt.generateIdentityToken,
 }
