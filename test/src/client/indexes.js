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

var Promise = require('promise')
var assert = require('assert')
var utils = require('./utils.js')

describe('frankly.Client room at ' + utils.getHost(), function () {
    it('create, read, update and delete indexes on Frankly server', function (done) {
        utils.forEachClient({role: 'admin'}, {
            connect: function () {
                var client = this.client
                var done = this.done

                function create(data) {
                    return new Promise(function (resolve, reject) {
                        client
                            .createIndex(data)
                            .then(function (other) {
                                assert.strictEqual(other.items.length, 2)
                                assert.strictEqual(other.items[0].target.id, data.items[0].target.id)
                                assert.strictEqual(typeof other.id, 'number')
                                assert.strictEqual(typeof other.version, 'number')
                                assert.strictEqual(other.updatedOn instanceof Date, true)
                                assert.strictEqual(other.createdOn instanceof Date, true)
                                resolve(other)
                            })
                            .catch(reject)
                    })
                }

                function read(index) {
                    return new Promise(function (resolve, reject) {
                        client.readIndex(index.id).then(function (other) {
                            assert.strictEqual(index.id, other.id)
                            assert.strictEqual(other.items[1].target.id, index.items[1].target.id)
                            assert.strictEqual(other.items.length, 2)
                            assert.strictEqual(typeof other.id, 'number')
                            assert.strictEqual(typeof other.version, 'number')
                            assert.strictEqual(other.updatedOn instanceof Date, true)
                            assert.strictEqual(other.createdOn instanceof Date, true)
                            resolve(other)
                        }).catch(reject)
                    })
                }

                function update(index) {
                    return new Promise(function (resolve, reject) {
                        client.updateIndex(index.id, {items: []}).then(function (other) {
                            assert.strictEqual(other.id, index.id)
                            assert.strictEqual(other.items.length, 0)
                            assert.strictEqual(typeof other.version, 'number')
                            assert.strictEqual(other.updatedOn instanceof Date, true)
                            assert.strictEqual(other.createdOn instanceof Date, true)
                            resolve(other)
                        }).catch(reject)
                    })
                }

                function del(index) {
                    return client.deleteIndex(index.id)
                }

                function success() {
                    client.close()
                    done()
                }

                function failure(e) {
                    client.close()
                    done(e)
                }

                create({
                    items: [
                        {
                            featured: true,
                            featuredImageUrl: "",
                            target: {
                                id: 74,
                                type: 'room'
                            }
                        },
                        {
                            featured: false,
                            featuredImageUrl: "",
                            target: {
                                id: 100,
                                type: 'selector'
                            }
                        }
                    ]
                })
                    .then(read)
                    .then(update)
                    .then(del)
                    .then(success)
                    .catch(failure)
            }
        }, done)
    })
})
