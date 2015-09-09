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
var message = require('../frankly/message.js')

describe('frankly.message', function () {
  describe('cloneContentsWithMetadata', function () {
    describe('basic', function () {
      it('contents should be cloned', function (done) {
        var orig = [{
          type: 'text/plain',
          value: 'hello world hahaha'
        }, {
          type: 'text/plain',
          value: 'hello world hahaha 1'
        }]
        var cloned = message.cloneContentsWithMetadata(orig)

        assert.notEqual(orig, cloned)
        assert.deepEqual(orig, cloned)

        done()
      })
    })

    describe('url metadata', function () {
      it('url metadata should be built', function (done) {
        var orig = [{
          type: 'text/plain',
          value: 'https://google.com hoho haha http://google.com'
        }, {
          type: 'text/plain',
          value: 'hey'
        }]
        var cloned = message.cloneContentsWithMetadata(orig)
        var metadata = cloned[0].metadata

        assert.deepEqual(metadata[0], {
          type: 'url',
          start: 0,
          length: 18,
          value: 'https://google.com'
        })

        assert.deepEqual(metadata[1], {
          type: 'url',
          start: 29,
          length: 17,
          value: 'http://google.com'
        })

        done()
      })

      it('appends protocol if missing', function (done) {
        var orig = [{
          type: 'text/plain',
          value: 'hahaha google.com hey hoho '
        }, {
          type: 'text/plain',
          value: 'hey'
        }]
        var cloned = message.cloneContentsWithMetadata(orig)
        var metadata = cloned[0].metadata

        assert.deepEqual(metadata[0], {
          type: 'url',
          start: 7,
          length: 10,
          value: 'http://google.com'
        })

        done()
      })
    })
  })
})
