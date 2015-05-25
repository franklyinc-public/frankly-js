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
var jws     = require('jws')

/**
 * This function generates an identity token suitable for a single authentication
 * attempt of a client against the Frankly API.
 *
 * @param {string} appKey
 *   The key that specifies which app this client is authenticating for, this value
 *   is provided by the Frankly Console.
 *
 * @param {string} appSecret
 *   The secret value associated the the key allowing the client to securely
 *   authenticate against the Frankly API.
 *
 * @param {string} nonce
 *  The nonce value got from Frankly SDK or API whether the identity generation
 *  comes from an client device or app backend.
 *
 * @param {object} options
 *  Optional object containing extra information about the authentication process.
 *
 * @param {string} options.uid
 *  This argument must be set to make the SDK operate on behalf of a specific user
 *  of the app.
 *  For backend services willing to interact with the API directly this may be omitted.
 *
 * @param {string} options.role
 *  For backend services using the Frankly API this can be set to 'admin' to
 *  generate a token allowing the client to get admin priviledges and perform
 *  operations that regular users are forbidden to.
 *
 * @return {string}
 *  The function returns the generated identity token as a string.
 */
function generateIdentityToken(appKey, appSecret, nonce, options) {
  var now = Date.now() / 1000
  var tok = {
    aak: appKey,
    iat: now,
    exp: now + 864000,
    nce: nonce,
  }

  if (options !== undefined) {
    if (options.user !== undefined) {
      tok.uid = options.user
    }

    if (options.role !== undefined) {
      tok.role = options.role
    }
  }

  return jws.sign({
    secret  : appSecret,
    payload : tok,
    header  : {
      alg: 'HS256',
      typ: 'JWS',
      cty: 'frankly-it;v1',
    }
  })
}

function identityTokenGenerator(appKey, appSecret, options) {
  return function (nonce) {
    return new Promise(function (resolve, reject) {
      var it = undefined

      try {
        it = generateIdentityToken(appKey, appSecret, nonce, options)
      } catch (e) {
        reject(e)
        return
      }

      resolve(it)
    })
  }
}

module.exports = {
  generateIdentityToken  : generateIdentityToken,
  identityTokenGenerator : identityTokenGenerator,
}