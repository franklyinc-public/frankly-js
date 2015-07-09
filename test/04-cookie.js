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
var Cookie = require('../frankly/cookie.js')

describe('frankly.Cookie', function () {
  describe('simple', function () {
    it('parse a simple cookie', function () {
      assert.deepEqual(Cookie.parse('hello=world'), {
        name     : 'hello',
        value    : 'world',
        path     : undefined,
        expires  : undefined,
        maxAge   : undefined,
        domain   : undefined,
        secure   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('domain', function () {
    it('parse a cookie with domain', function () {
      assert.deepEqual(Cookie.parse('hello=world; domain=.franklychat.com'), {
        name     : 'hello',
        value    : 'world',
        domain   : '.franklychat.com',
        path     : undefined,
        expires  : undefined,
        maxAge   : undefined,
        secure   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('path', function () {
    it('parse a cookie with path', function () {
      assert.deepEqual(Cookie.parse('hello=world; path=/prefix'), {
        name     : 'hello',
        value    : 'world',
        path     : '/prefix',
        expires  : undefined,
        maxAge   : undefined,
        domain   : undefined,
        secure   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('max-age', function () {
    it('parse a cookie with max-age', function () {
      assert.deepEqual(Cookie.parse('hello=world; max-age=42'), {
        name     : 'hello',
        value    : 'world',
        maxAge   : 42,
        expires  : new Date(42000),
        path     : undefined,
        domain   : undefined,
        secure   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('expires', function () {
    it('parse a cookie with expires', function () {
      var date = new Date('2015-01-01T23:42:00Z')
      assert.deepEqual(Cookie.parse('hello=world; expires=2015-01-01T23:42:00Z'), {
        name     : 'hello',
        value    : 'world',
        maxAge   : Math.floor(date.getTime() / 1000),
        expires  : date,
        path     : undefined,
        domain   : undefined,
        secure   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('secure', function () {
    it('parse a cookie with secure', function () {
      assert.deepEqual(Cookie.parse('hello=world; secure'), {
        name     : 'hello',
        value    : 'world',
        secure   : true,
        path     : undefined,
        expires  : undefined,
        maxAge   : undefined,
        domain   : undefined,
        httpOnly : undefined,
      })
    })
  })

  describe('http-only', function () {
    it('parse a cookie with http-onlye', function () {
      assert.deepEqual(Cookie.parse('hello=world; HttpOnly'), {
        name     : 'hello',
        value    : 'world',
        httpOnly : true,
        path     : undefined,
        expires  : undefined,
        maxAge   : undefined,
        domain   : undefined,
        secure   : undefined,
      })
    })
  })

  describe('complex', function () {
    it('parse a complex cookie', function () {
      assert.deepEqual(Cookie.parse('hello=world; domain=.franklychat.com; path=/prefix; max-age=42; secure; HttpOnly'), {
        name     : 'hello',
        value    : 'world',
        domain   : '.franklychat.com',
        path     : '/prefix',
        maxAge   : 42,
        expires  : new Date(42000),
        httpOnly : true,
        secure   : true,
      })
    })
  })
})
