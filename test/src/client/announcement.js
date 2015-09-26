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
var utils = require('./utils.js')

describe('frankly.Client announcement at ' + utils.getHost(), function () {
  describe('error handling', function () {
    it("don't allow invalid announcement", function (done) {
      utils.forEachClient({ role: 'admin' }, {
        connect: function () {
          var client = this.client
          var done = this.done

          client.createAnnouncement({
            contents: [{
              type: 'text/plain'
            }]
          }).then(function () {
            done(new Error('this request has invalid format, but succeeded'))
          })
            .catch(function (error) {
              assert.strictEqual(error.status, 400)
              done()
            })
        }
      }, done)
    })
  })
})
