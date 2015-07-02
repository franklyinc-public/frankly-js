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
var auth   = require('../frankly/authenticate.js')
var jwt    = require('../frankly/jwt.js')

describe('frankly.Authenticate', function () {
  var appKey    = process.env.FRANKLY_APP_KEY
  var appSecret = process.env.FRANKLY_APP_SECRET
  var appHost   = process.env.FRANKLY_APP_HOST

  describe('success', function () {
    it("sucessfuly authenticates against a Frankly server running at " + appHost, function (done) {
      auth(appHost, jwt.identityTokenGenerator(appKey, appSecret, { role: 'admin' }))
        .then(function (session) {
          assert(typeof session.user.id !== 'undefined')
          assert(typeof session.app.id !== 'undefined')
          assert(typeof session.token !== 'undefined')
          assert(session.created_on instanceof Date)
          assert(session.updated_on instanceof Date)
          assert(session.expires_on instanceof Date)
          assert.strictEqual(session.platform, 'javascript')
          assert.strictEqual(session.role, 'admin')
          assert.strictEqual(session.version, 1)
          assert.notStrictEqual(session.seed, 0)
          assert.notStrictEqual(session.seed, null)
          assert.notStrictEqual(session.seed, undefined)
          done()
        })
        .catch(done)
    })
  })

  describe('failure', function () {
    it("fails to authenticate against a Frankly server running at " + appHost, function (done) {
      auth(appHost, jwt.identityTokenGenerator(appKey, appSecret.split('').reverse().join(''), { role: 'admin' }))
        .then(function (session) {
          done(new Error("successful authentication: " + session))
        })
        .catch(function (error) {
          done()
        })
    })
  })
})
