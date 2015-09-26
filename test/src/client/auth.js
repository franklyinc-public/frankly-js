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

describe('frankly.Client auth at ' + utils.getHost(), function () {
  it('connects with proper order of events', function (done) {
    var counter = 0

    utils.forEachClient({
      role: 'admin'
    }, {
      'open': function () {
        this._open = ++counter
      },
      'authenticate': function (session) {
        assert.strictEqual(session.user.role, 'admin')
        this._authenticate = ++counter
      },
      'connect': function () {
        this._connect = ++counter
        this.client.close()
      },
      'close': function () {
        this._close = ++counter
        try {
          // Make sure events are triggered in order
          assert.strictEqual(this._open < this._authenticate && this._authenticate < this._connect && this._connect < this._close, true)
          this.done()
        } catch (e) {
          this.done(e)
        }
      }
    }, done)
  })
})
