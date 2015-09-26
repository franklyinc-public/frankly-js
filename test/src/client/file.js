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

var fs = require('fs')
var Promise = require('promise')
var assert = require('assert')
var utils = require('./utils.js')
var imageFileBase64 = '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'

describe('frankly.Client file at ' + utils.getHost(), function () {
  it('creates a file and updates the content', function (done) {
    utils.forEachClient({ role: 'admin' }, {
      'connect': function () {
        var client = this.client
        var done = this.done()

        function failure (err) {
          client.close()
          done(err)
        }

        client
          .createFile({
            category: 'useravatar', type: 'image'
          })
          .then(function (res) {
            client
              .updateFile(res.url, fs.readFileSync('test/assets/image.png'))
              .then(function () {
                client
                  .updateFile(res.url, new Buffer(imageFileBase64, 'base64'))
                  .then(done)
                  .catch(failure)
              })
              .catch(failure)
          })
          .catch(failure)
      }
    }, done)
  })
})
