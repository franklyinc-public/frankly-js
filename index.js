/*!
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

var Promise       = require('promise')
var FranklyClient = require('./frankly/client.js')
var FranklyError  = require('./frankly/error.js')
var jwt           = require('./frankly/jwt.js')
var parent        = require('./frankly/parent.js')
var widgets       = require('./frankly/widgets.js')
var runtime       = require('./frankly/runtime.js')

var index = {
  FranklyClient          : FranklyClient,
  FranklyError           : FranklyError,
  generateIdentityToken  : jwt.generateIdentityToken,
  identityTokenGenerator : jwt.identityTokenGenerator,
}

var key = undefined

if (runtime.browser) {
  index.parent = parent
  index.widgets = widgets

  if (global.frankly === undefined) {
    global.frankly = { }
  }

  for (key in index) {
    global.frankly[key] = index[key]
  }

  if (global.Promise === undefined) {
    global.Promise = Promise
  }
}

module.exports = index
