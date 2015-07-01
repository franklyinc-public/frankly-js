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

var Promise  = require('promise')
var reqid    = 1
var requests = { }

window.addEventListener('message', function (event) {
  var res = event.data
  var req = undefined

  if (res !== undefined && res.id !== undefined) {
    req = requests[res.id]
  }

  if (req === undefined) {
    return
  }

  if (res.protocol !== req.protocol) {
    console.log("frankly.parent received a response with an invalid protocol", res)
    return
  }

  if (res.method !== req.method) {
    console.log("frankly.parent received a response with a method that didn't match the request", res)
    return
  }

  if (res.type !== 'response') {
    return
  }

  if (req.timeout !== undefined) {
    try {
      clearTimeout(req.timeout)
    } catch (e) {
      console.log(e)
    }
  }

  try {
    if (res.ok) {
      req.resolve(res.data)
    } else {
      req.reject(res.data)
    }
  } catch (e) {
    console.log(e)
  } finally {
    delete requests[res.id]
  }
})

module.exports = {
  init: function(){ },

  request: function (method, data, timeout) {
    var id = ++reqid

    if (timeout !== undefined) {
      timeout = setTimeout(function () {
        var req = requests[id]

        if (req !== undefined) {
          delete requests[id]

          try {
            req.reject(new Error('request timed out after ' + (timeout / 1000) + 's'))
          } catch (e) {
            console.log(e)
          }
        }
      }, timeout)
    }

    return new Promise(function (resolve, reject) {
      var req = {
        protocol : 'frankly;v1',
        id       : id,
        method   : method,
        type     : 'request',
        data     : data,
        time     : new Date,
        timeout  : timeout,
        resolve  : resolve,
        reject   : reject,
      }

      requests[req.id] = req

      window.parent.postMessage({
        protocol : req.protocol,
        id       : req.id,
        method   : req.method,
        type     : req.type,
        time     : req.time,
        data     : req.data,
      }, '*')
    })
  }
}
