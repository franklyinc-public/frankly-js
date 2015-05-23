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

var http         = require('http')
var https        = require('https')
var Promise      = require('promise')
var UserAgent    = require('./useragent.js')
var FranklyError = require('./error.js')
var normalize    = require('./normalize.js')
var denormalize  = require('./denormalize.js')

function operation(method) {
  switch (method) {
  case undefined: return 'read'
  case 'GET':     return 'read'
  case 'POST':    return 'create'
  case 'PUT':     return 'update'
  case 'DELETE':  return 'delete'
  default:        return 'unknown'
  }
}

function request(options, data) {
  var request = http.request
  var encoder = undefined

  switch (options.protocol) {
  case undefined:
    break

  case 'https:':
    request = https.request
    break

  default:
    throw new Error("protocol must be 'http', 'https or undefined to submit http requests: found " + options.protocol)
  }

  if (options.headers === undefined) {
    options.headers = { }
  }

  if (options.headers['user-agent'] === undefined) {
    options.headers['user-agent'] = UserAgent
  }

  if (options.headers['accept'] === undefined) {
    options.headers['accept'] = 'application/json'
  }

  if (options.headers['content-type'] === undefined) {
    options.headers['content-type'] = 'application/json'
    encoder = JSON.stringify
  }

  if (data === undefined) {
    data = ''
    options.headers['content-length'] = 0
  } else {
    if (encoder !== undefined) {
      data = encoder(denormalize(data))
    }
    options.headers['content-length'] = data.length
  }

  return new Promise(function (resolve, reject) {
    var req = http.request(options)

    if (options.timeout !== undefined) {
      // http-browserify doesn't support this method yet:
      // based on https://github.com/substack/http-browserify/pull/80
      if (req.setTimeout === undefined) {
        req.xhr.ontimeout = req.emit.bind(req, 'timeout')
        req.xhr.timeout   = msecs
      } else {
        req.setTimeout(options.timeout)
      }
    }

    req.on('response', function (res) {
      var content = undefined

      res.on('data', function (chunk) {
        if (content === undefined) {
          content = '' + chunk
        } else {
          content += chunk
        }
      })

      res.on('end', function () {
        try {
          if (content !== undefined && res.headers['content-type'] === 'application/json') {
            content = normalize(JSON.parse(content))
          }
          res.content = content
          resolve(res)
        } catch (e) {
          reject(new FranklyError(operation(options.method), options.path, 500, e.message))
        }
      })
    })

    req.on('error', function (e) {
      reject(new FranklyError(operation(options.method), options.path, 500, e.message))
    })

    req.on('timeout', function () {
      reject(new FranklyError(operation(options.method), options.path, 408, "request timed out"))
    })

    req.write(data)
    req.end()
  })
}

module.exports = {
  'request': request,

  'del': function (options) {
    options.method = 'DELETE'
    return request(options)
  },

  'get': function (options) {
    options.method = 'GET'
    return request(options)
  },

  'post': function (options, data) {
    options.method = 'POST'
    return request(options, data)
  },

  'put': function (options, data) {
    options.method = 'PUT'
    return request(options, data)
  },
}
