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
var url = require('url')
var Error = require('./error.js')
var http = require('./http.js')
var runtime = require('./runtime.js')
var auth = undefined

function errorHandler (operation, path, reject) {
  return function (err) {
    if (err.status === undefined) {
      err = Error.make(operation, path, 500, err.message)
    }
    reject(err)
  }
}

function nocookie (options, generateIdentityToken) {
  function generateNonce () {
    options.path = '/auth/nonce'

    return new Promise(function (resolve, reject) {
      http.get(options)
        .then(function (res) {
          resolve(res.content)
        })
        .catch(errorHandler('read', options.path, reject))
    })
  }

  return new Promise(function (resolve, reject) {
    generateNonce()
      .then(generateIdentityToken)
      .then(function (identityToken) {
        resolve({ identityToken: identityToken, path: '/auth' })
      })
      .catch(reject)
  })
}

function common (options, generateIdentityToken) {
  function generateNonce () {
    options.path = '/auth/nonce'

    return new Promise(function (resolve, reject) {
      http.get(options)
        .then(function (res) {
          resolve(res.content)
        })
        .catch(errorHandler('read', options.path, reject))
    })
  }

  function generateSessionToken (identityToken) {
    options.path = '/auth'
    options.headers = { 'frankly-app-identity-token': identityToken }

    return new Promise(function (resolve, reject) {
      http.get(options)
        .then(function (res) {
          var session = res.content
          session.headers = res.headers
          session.cookies = res.cookies
          session.path = ''
          session.xsrf = res.headers['frankly-app-xsrf']
          resolve(session)
        })
        .catch(errorHandler('read', options.path, reject))
    })
  }

  return new Promise(function (resolve, reject) {
    generateNonce()
      .then(generateIdentityToken)
      .then(generateSessionToken)
      .then(resolve)
      .catch(reject)
  })
}

switch (runtime.browser) {
  case 'ie10':
  case 'safari':
    auth = nocookie
    break

  default:
    auth = common
    break
}

function authenticate (address, generateIdentityToken, options) {
  var u = undefined

  if (typeof address !== 'string') {
    throw new Error('authentication against Frankly servers requires a string for address but ' + address + ' was found')
  }

  if (typeof generateIdentityToken !== 'function') {
    throw new Error('authentication against Frankly servers requires a function callback as second argument to generate the identity token')
  }

  u = url.parse(address)

  switch (u.protocol) {
    case 'http:':
    case 'https:':
      break

    case 'ws:':
      u.protocol = 'http:'
      break

    case 'wss:':
      u.protocol = 'https:'
      break

    default:
      throw new Error('authenticating against Frankly servers is only available over http or https but ' + u.protocol + ' was found')
  }

  if (options === undefined) {
    options = { }
  }

  if (options.timeout === undefined) {
    options.timeout = 5000
  }

  options.protocol = u.protocol
  options.host = u.hostname
  options.port = u.port
  return auth(options, generateIdentityToken)
}

module.exports = authenticate
