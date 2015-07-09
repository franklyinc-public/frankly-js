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

var Cookie = {

  get: function (cookies, name) {
    var index  = undefined
    var cookie = undefined

    for (index in cookies) {
      cookie = cookies[index]

      if (cookie.name === name) {
        return cookie
      }
    }
  },

  parse: function (header) {
    var array = undefined
    var index = undefined

    if (header instanceof Array) {
      array = [ ]

      for (index in header) {
        array.push(Cookie.parseOne(header[index]))
      }

      return array
    }

    return Cookie.parseOne(header)
  },

  parseOne: function (header) {
    var parts  = header.split(';')
    var index  = undefined
    var value  = undefined
    var cookie = {
      name     : undefined,
      value    : undefined,
      path     : undefined,
      expires  : undefined,
      maxAge   : undefined,
      domain   : undefined,
      secure   : undefined,
      httpOnly : undefined,
    }

    if (parts.length > 0) {
      value = parts[0]
      value.trim()
      index = value.indexOf('=')
      cookie.name = value.slice(0, index)
      cookie.value = value.slice(index + 1)
    }

    for (index = 1; index < parts.length; ++index) {
      value = parts[index].trim().toLowerCase()

      if (value.indexOf('domain=') === 0) {
        cookie.domain = value.slice(7)
        continue
      }

      if (value.indexOf('path=') === 0) {
        cookie.path = value.slice(5)
        continue
      }

      if (value.indexOf('expires=') === 0) {
        cookie.expires = new Date(value.slice(8))
        continue
      }

      if (value.indexOf('max-age=') === 0) {
        cookie.maxAge = parseInt(value.slice(8))
        continue
      }

      if (value === 'httponly') {
        cookie.httpOnly = true
        continue
      }

      if (value === 'secure') {
        cookie.secure = true
        continue
      }
    }

    if (cookie.maxAge === undefined) {
      if (cookie.expires !== undefined) {
        cookie.maxAge = Math.floor(cookie.expires.getTime() / 1000)
      }
    }

    if (cookie.expires === undefined) {
      if (cookie.maxAge !== undefined) {
        cookie.expires = new Date(cookie.maxAge * 1000)
      }
    }

    return cookie
  },

  format: function (cookie) {
    return cookie.name + '=' + cookie.value
  },

  expired: function (cookie, now) {
    if (now === undefined) {
      now = Date.now()
    } else {
      now = now.getTime()
    }
    return Math.floor(now / 1000) >= cookie.maxAge
  },

}

module.exports = Cookie
