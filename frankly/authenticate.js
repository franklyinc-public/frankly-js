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

var http         = require('./http.js')
var url          = require('url')
var Promise      = require('promise')
var FranklyError = require('./error.js')

function errorHandler(operation, path, reject) {
  return function (err) {
    if (!(err instanceof FranklyError)) {
      err = new FranklyError(operation, path, 500, err.message)
    }
    reject(err)
  }
}

function authenticate(address, generateIdentityToken, options) {
  if (typeof address !== 'string') {
    throw new Error("authentication against Frankly servers requires a string for address but " + address + " was found")
  }

  if (typeof generateIdentityToken !== 'function') {
    throw new Error("authentication against Frankly servers requires a function callback as second argument to generate the identity token")
  }

  address = url.parse(address)

  switch (address.protocol) {
  case 'http:':
    break

  case 'https:':
    break

  default:
    throw new Error("authenticating against Frankly servers is only available over http or https but " + address.protocol + " was found")
  }

  if (options === undefined) {
    options = { }
  }

  if (options.timeout === undefined) {
    options.timeout = 5000
  }

  options.host = address.hostname
  options.port = address.port

  function generateNonce() {
    options.path = '/auth/nonce'
    return new Promise(function (resolve, reject) {
      http.get(options)
        .then(function (res) {
          if (res.statusCode !== 200) {
            throw new FranklyError('read', options.path, res.statusCode, res.content)
          }
          resolve(res.content)
        })
        .catch(errorHandler('read', options.path, reject))
    })
  }

  function generateSessionToken(identityToken) {
    options.path = '/auth?identity_token=' + identityToken
    return new Promise(function (resolve, reject) {
      http.get(options)
        .then(function (res) {
          if (res.statusCode !== 200) {
            throw new FranklyError('read', options.path, res.statusCode, res.content)
          }
          resolve(res.content)
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

module.exports = authenticate
