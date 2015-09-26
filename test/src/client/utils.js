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

var _defaultsDeep = require('lodash/object/defaultsDeep')
var Promise = require('promise')
var jwt = require('../../../frankly/jwt.js')
var Client = require('../../../frankly/client.js')
var appKey = process.env.FRANKLY_APP_KEY
var appSecret = process.env.FRANKLY_APP_SECRET
var appHost = process.env.FRANKLY_APP_HOST
var httpHost = undefined
var wsHost = undefined
var utils = undefined
var clientEvents = ['open', 'connect', 'authenticate', 'close', 'error']

if (appHost.indexOf('ws') === 0) {
  if (appHost.indexOf('wss') === 0) {
    httpHost = 'https' + appHost.slice(3)
  } else if (appHost.indexOf('ws') === 0) {
    httpHost = 'http' + appHost.slice(2)
  }
  wsHost = appHost
} else if (appHost.indexOf('http') === 0) {
  if (appHost.indexOf('https') === 0) {
    wsHost = 'wss' + appHost.slice(5)
  }else if (appHost.indexOf('http') === 0) {
    wsHost = 'ws' + appHost.slice(4)
  }
  httpHost = appHost
} else {
  // Assuming host without protocol
  wsHost = 'wss://' + appHost
  httpHost = 'https://' + appHost
}

utils = {
  getHost: function () {
    var host = appHost
    var i = host.indexOf('://')

    if (i > -1) {
      host = host.substring(i + 3)
    }

    return host
  },

  getHttpHost: function () {
    return httpHost
  },

  getWsHost: function () {
    return wsHost
  },

  deferOpenHttpClient: function (user) {
    return this._deferOpenClient(httpHost, user)
  },

  deferOpenWsClient: function (user) {
    return this._deferOpenClient(wsHost, user)
  },

  done: function (count, done) {
    return function () {
      if (--count === 0) {
        done.apply(null, arguments)
      }
    }
  },

  forEachClient: function (user, events, done) {
    var clients = [this.deferOpenHttpClient(user), this.deferOpenWsClient(user)]
    var alldone = this.done(clients.length, done)

    clients.forEach(function (client) {
      var context = {
        client: client,
        done: alldone
      }

      clientEvents
        .forEach(function (event) {
          client.on(event, function (data) {
            if (events[event]) {
              events[event].call(context, data)
            } else if (event === 'error') {
              // bail out
              done(data)
            }
          })
        })
    })
  },

  _deferOpenClient: function (host, user) {
    var client = new Client(host)

    user = _defaultsDeep(user || {}, { role: 'admin' })

    setTimeout(function () {
      client.open(jwt.identityTokenGenerator(appKey, appSecret, user))
    }, 0)

    return client
  }
}

module.exports = utils
