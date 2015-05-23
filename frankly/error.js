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

/**
 * Instances of this class are used to represent errors that may be raised from
 * any call to methods of the {@linke FranklyClient} class.
 *
 * @constructor
 *
 * @param {string} operation
 *   The operation that generated the error, one of 'authenticate', 'create',
 *   'read', 'update' or 'delete'.
 *
 * @param {string} path
 *   The path on which the operation that generated the error was executed.
 *
 * @param {int} status
 *   The status code representing the error.
 *
 * @param {string} message
 *   A human-readable description of the error.
 */
function FranklyError(operation, path, status, message) {
  Error.call(this)

  if (typeof path !== 'string') {
    path = joinPath(path)
  }

  this.operation = operation
  this.path      = path
  this.status    = status
  this.message   = message
}

FranklyError.prototype = Object.create(Error.prototype)
FranklyError.prototype.constructor = FranklyError

function joinPath(path) {
  return '/' + path.join('/')
}

module.exports = FranklyError
