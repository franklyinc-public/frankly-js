'use strict'

var assert    = require('assert')
var WebSocket = require('ws')
var Packet    = require('../frankly/packet.js')
var Socket    = require('../frankly/socket.js')

describe('frankly.Socket', function () {
  it('connects to a websocket server and exchange packets', function (done) {
    var server = new WebSocket.Server({ port: 4455 })

    server.on('connection', function (client) {
      client.on('message', function (data, flags) {
        var packet = undefined

        try {
          packet = Packet.decode(new Uint8Array(data))
        } catch (e) {
          client.close()
          return
        }

        packet.type    = 0
        packet.payload = { answer: 42 }

        client.send(new Buffer(Packet.encode(packet)), { binary: true })
      })
    })

    server.on('listening', function () {
      var socket = new Socket('ws://127.0.0.1:4455')
      var ok     = false

      socket.on('open', function () {
        try {
          socket.send(new Packet(1, 1, 2, ['hello', 'world'], { }, null))
        } catch (e) {
          socket.close()
          server.close()
          done(e)
          return
        }

        socket.on('close', function (code, reason) {
          try {
            switch (ok) {
            case true:
              done()
              break

            case false:
              done({ code: code, reason: reason })
              break
            }
          } finally {
            server.close()
          }
        })

        socket.on('packet', function (packet) {
          ok = true
          try {
            assert.strictEqual(packet.type, 0)
            assert.strictEqual(packet.seed, 1)
            assert.strictEqual(packet.id, 2)
            assert.strictEqual(packet.path.length, 2)
            assert.strictEqual(packet.path[0], 'hello')
            assert.strictEqual(packet.path[1], 'world')
            assert.strictEqual(packet.payload.answer, 42)
          } catch (e) {
            ok = undefined
            done(e)
            server.close()
          } finally {
            socket.close()
          }
        })
      })
    })
  })
})
