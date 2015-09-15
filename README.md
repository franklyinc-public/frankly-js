frankly-js
==========

Frankly Chat SDK for web browsers and Node.js applications.

Installation
------------

The simplest way to install this module is to use the deployed package on npm:
```
$ npm install frankly-js
```

Usage (Node.js)
---------------

After installing the SDK you can import it like any standard node module using
the require function, here's a quick example of how this is usually done:

```js
var frankly = require('frankly-js')

// Create a client that interacts with the Frankly API over HTTP, ideal for
// efficient server-to-server operations.
var client = new frankly.Client('https')
var key    = '...'
var secret = '...'

// Opens the client to make operations on behalf of the admin user of the app.
client.open(key, secret, { role: 'admin' })

// Send a sticky message to a room with id 42.
client.createRoomMessage(42, {
  contents : [{ type: 'text/plain', value: 'Hello World!' }],
  sticky   : true,
})
.then(function (message) {
  ...
})
.catch(function (error) {
  ...
})
```

Usage (Browsers)
----------------

The code is also published online and can be embeded directly into a web page:

```html
<script src="https://cdn.franklychat.com/frankly-js/1/frankly.min.js"></script>
<script>
  // Create a client that interacts with the Frankly API over WebSocket,
  // enables receiving real-time messages, automatic reconnections and
  // authentication.
  var client = new frankly.Client('wss')

  client.open(function (nonce) {
      return new Promise(function (resolve, reject) {
          // Call a backend endpoint to generate identity tokens and resolve the
          // promise.
          ...
      })
  })

  client.on('error', function (error) {
    // Called if the client fails to connect or authenticate.
    ...
  })

  client.on('authenticate', function (session) {
    // Called when the client successfully authenticates.
    ...
  })

  client.on('connect', function () {
    // Called when the client sucessfully establishes a websocket connection.
    ...
  })

  client.on('disconnect', function (event) {
    // Called if the client loses an established websocket connection.
    ...
  })

  client.on('update', function (event) {
    // Called when the server pushes a resource update signal to the client.
    ...
  })

  client.on('delete', function (event) {
    // Called when the server pushes a resource deletion signal to the client.
    ...
  })
</script>
```

Formatting
-------------
Follows https://github.com/feross/standard
```
$ npm install standard -g
$ standard --format
```

Building
-------------

To build the JS SDK, determine your version (as `{$version}`), and run 

```
$ ./scripts/build ./dist {$version}
```

Testing
-------------

`mocha` is required to run the test suite, the following environment variables
also have to be set:

- `FRANKLY_APP_HOST` usually set to https://app.franklychat.com
- `FRANKLY_APP_KEY` the app key obtained from the *Frankly Console*.
- `FRANKLY_APP_SECRET` the app secret obtained from the *Frankly Console*.

then simply run

```
$ npm test
```

To run a single test in isolation, run
```
$ mocha test/[name-of-test-file.js] --timeout=10000
```

Documentation
-------------

To create documentation for the JS SDK, make sure you have [jsdoc](https://github.com/jsdoc3/jsdoc) installed and run 

```
$ ./scripts/gendoc ./doc
```

The reference documentation can be found at http://franklyinc.github.io/APIReference-JavaScript.html

