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
var client  = new frankly.FranklyClient()

var appKey    = 'app key from https://console.franklychat.com'
var appSecret = 'app secret from https://console.franklychat.com'

client.open(frankly.identityTokenGenerator(appKey, appSecret, {
    role: 'admin',
}))
.then(function (session) {
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
<script src="https://d13r8avoofccpt.cloudfront.net/{version}/frankly.min.js"></script>
<script>
  var client = new frankly.FranklyClient()

  client.open(function (nonce) {
      return new Promise(function (resolve, reject) {
          // call backend endpoint to generate identity tokens and resolve the
          // promise.
          ...
      })
  })
  .then(function (session) {
      ...
  })
  .catch(function (error) {
      ...
  })
</script>
```

Testing
=======

`mocha` is required to run the test suite, the following environment variables
also have to be set:

- `FRANKLY_APP_HOST` usually set to https://app.franklychat.com
- `FRANKLY_APP_KEY` the app key obtained from the *Frankly Console*.
- `FRANKLY_APP_SECRET` the app secret obtained from the *Frankly Console*.

then simply run

```
$ npm test
```

Documentation
-------------

The reference documentation can be found at http://franklyinc.github.io/APIReference-JavaScript.html

