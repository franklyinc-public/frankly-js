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

var assert  = require('assert')
var nhttp   = require('http')
var fhttp   = require('../frankly/http.js')

describe('frankly.Http', function () {
  describe('GET', function () {
    it('creates a web server and submits a get request', function (done) {
      var host   = '127.0.0.1'
      var port   = 4460
      var server = nhttp.createServer()

      server.on('request', function (req, res) {
        res.writeHead(200, 'OK', {
          'content-type': 'application/json',
        })

        res.write(JSON.stringify("Hello World!"))
        res.end()
      })

      server.on('listening', function () {
        var options = { host: host, port: port }

        fhttp.get(options)
          .then(function (res) {
            try {
              assert.strictEqual(res.statusCode, 200)
              assert.strictEqual(res.content, "Hello World!")
              done()
            } catch (e) {
              done(e)
            } finally {
              server.close()
            }
          })
          .catch(function (error) {
            server.close()
            done(error)
          })
      })

      server.listen(port, host)
      server.on('error', done)
    })
  })

  describe('POST', function () {
    it('creates a web server and submits a get request', function (done) {
      var host   = '127.0.0.1'
      var port   = 4461
      var server = nhttp.createServer()

      server.on('request', function (req, res) {
        var content = ''

        req.on('data', function (chunk) {
          content += chunk
        })

        req.on('end', function () {
          content = JSON.parse(content)

          res.writeHead(201, 'Created', {
            'content-type': 'application/json',
          })

          res.write(JSON.stringify(content))
          res.end()
        })
      })

      server.on('listening', function () {
        var payload = "Hello World!"
        var options = { host: host, port: port }

        fhttp.post(options, payload)
          .then(function (res) {
            try {
              assert.strictEqual(res.statusCode, 201)
              assert.strictEqual(res.content, payload)
              done()
            } catch (e) {
              done(e)
            } finally {
              server.close()
            }
          })
          .catch(function (error) {
            server.close()
            done(error)
          })
      })

      server.listen(port, host)
      server.on('error', done)
    })
  })

  describe('PUT', function () {
    it('creates a web server and submits a get request', function (done) {
      var host   = '127.0.0.1'
      var port   = 4462
      var server = nhttp.createServer()

      server.on('request', function (req, res) {
        var content = ''

        req.on('data', function (chunk) {
          content += chunk
        })

        req.on('end', function () {
          content = JSON.parse(content)

          res.writeHead(200, 'OK', {
            'content-type': 'application/json',
          })

          res.write(JSON.stringify(content))
          res.end()
        })
      })

      server.on('listening', function () {
        var payload = 42
        var options = { host: host, port: port }

        fhttp.put(options, payload)
          .then(function (res) {
            try {
              assert.strictEqual(res.statusCode, 200)
              assert.strictEqual(res.content, 42)
              done()
            } catch (e) {
              done(e)
            } finally {
              server.close()
            }
          })
          .catch(function (error) {
            server.close()
            done(error)
          })
      })

      server.listen(port, host)
      server.on('error', done)
    })
  })

  describe('DELETE', function () {
    it('creates a web server and submits a delete request', function (done) {
      var host   = '127.0.0.1'
      var port   = 4460
      var server = nhttp.createServer()

      server.on('request', function (req, res) {
        res.writeHead(204, 'Gone', {
          'content-type'   : 'application/json',
          'content-length' : 0,
        })

        res.end()
      })

      server.on('listening', function () {
        var options = { host: host, port: port }

        fhttp.del(options)
          .then(function (res) {
            try {
              assert.strictEqual(res.statusCode, 204)
              assert.strictEqual(res.content, undefined)
              done()
            } catch (e) {
              done(e)
            } finally {
              server.close()
            }
          })
          .catch(function (error) {
            server.close()
            done(error)
          })
      })

      server.listen(port, host)
      server.on('error', done)
    })
  })

})
