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
var assert = require('assert')
var utils = require('./utils.js')

describe('frankly.Client user at ' + utils.getHost(), function () {
  it('authenticates as a user and updates the display name', function (done) {
    utils.forEachClient({ role: 'admin' }, {
      authenticate: function (session) {
        var client = this.client
        var done = this.done

        function success (user) {
          try {
            assert.strictEqual(user.displayName, 'Luke Skywalker')
            done()
          } catch (e) {
            failure(e)
          }
        }

        function failure (err) {
          client.close()
          done(err)
        }

        client.updateUser(
          session.user.id, {
            displayName: 'Luke Skywalker',
          })
          .then(success)
          .catch(failure)
      }
    }, done)
  })
})
