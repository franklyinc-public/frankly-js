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

var _forEach = require('./utility/collection/forEach')

function denormalize (object) {
  var k = undefined
  var x = undefined

  if (typeof object !== 'object') {
    return object
  }

  if (object === null) {
    return object
  }

  if (object instanceof Date) {
    return object.toISOString()
  }

  if (object instanceof Array) {
    _forEach(object, function (val, key) {
      object[key] = denormalize(val)
    })

    return object
  }

  x = { }

  _forEach(object, function (val, key) {
    x[underscore(key)] = denormalize(val)
  })

  return x
}

function underscore (k) {
  var s = ''
  var i = undefined
  var c = undefined

  for (i = 0; i != k.length; i++) {
    c = k.charAt(i)

    if (c === c.toUpperCase()) {
      s += '_'
      s += c.toLowerCase()
    } else {
      s += c
    }
  }

  return s
}

module.exports = denormalize
