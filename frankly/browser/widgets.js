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

var configs = [ ]

var methods = {
  configuration: function (request, source, origin) {
    return new Promise(function (resolve, reject) {
      var config = getConfigByWindowOrDefault(source)

      if (config === undefined) {
        // If there are no configuration available we place a callback
        // in the list of pending windows waiting for a configuration
        // item to become available.
        configs.push({
          ready: false,
          window: source,
          pending: [
            function (config) {
              resolve(cleanConfig(config))
            },
          ]
        })
        return
      } else if (!config.ready) {
        config.pending.push(function (config) {
          resolve(cleanConfig(config))
        })
        return
      }

      resolve(cleanConfig(config))
    })
  },

  authentication: function (request, source, origin) {
    return new Promise(function (resolve, reject) {
      var config = getConfigByWindowOrDefault(source)

      if (config === undefined) {
        reject(new Error("No configuration was found for the requesting window"))
        return
      }

      if (config.onAuthenticationRequest === undefined) {
        reject(new Error("No authentication method available for the requesting window"))
        return
      }

      console.log(request, request.data);

      config.onAuthenticationRequest(request.data)
        .then(resolve)
        .catch(reject)
    })
  },
}

function success(result, request, source, origin) {
  source.postMessage({
    protocol : request.protocol,
    id       : request.id,
    method   : request.method,
    type     : 'response',
    ok       : true,
    time     : new Date,
    data     : result,
  }, origin)
}

function failure(error, request, source, origin) {
  try {
    error = {
      name    : error.name,
      message : error.message,
    }
  } catch (e) {
    console.log(error)
    error = {
      name    : e.name,
      message : e.message,
    }
  }

  source.postMessage({
    protocol: request.protocol,
    id      : request.id,
    method  : request.method,
    type    : 'response',
    ok      : false,
    time    : new Date,
    data    : error,
  }, origin)
}

function copyConfig(config) {
  var cfg = config instanceof Array ? [ ] : { }
  var key = undefined
  var val = undefined

  for (key in config) {
    val = config[key]

    if (val === null) {
      cfg[key] = null
      continue
    }

    if (typeof val === 'object') {
      throw new TypeError("unexpected object in configuration")
    }

    cfg[key] = val
  }

  return cfg
}

function cleanConfig(config) {
  var cfg = config instanceof Array ? [ ] : { }
  var key = undefined
  var val = undefined

  for (key in config) {
    val = config[key]

    if (val === null) {
      cfg[key] = val
      continue
    }

    switch (typeof val) {
    case 'undefined':
    case 'boolean':
    case 'number':
    case 'string':
    case 'symbol':
      cfg[key] = val
      break
    case 'function':
      cfg[key] = true
      break
    }
  }

  return cfg
}

function notifyConfigReady(config) {
  var pending = config.pending
  var key = undefined

  if (pending !== undefined) {
    for (key in pending) {
      try {
        pending[key](config)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

function getConfigByWindow(window) {
  var index = undefined

  for (index in configs) {
    if (configs[index].window === window) {
      return configs[index]
    }
  }

  return undefined
}

function getConfigByWindowOrDefault(window) {
  var config = getConfigByWindow(window)

  if (config === undefined) {
    config = getConfigByWindow(undefined)
  }

  return config
}

window.addEventListener('message', function (event) {
  var request = event.data
  var source  = event.source
  var origin  = event.origin
  var method  = undefined

  if (request === undefined) {
    console.log('frankly widgets received an invalid event (undefined request)')
    return
  }

  if (source === undefined) {
    console.log('frankly widgets received an invalid event (undinfed source)')
    return
  }

  if (origin === undefined) {
    console.log('frankly widgets received an invalid event (undefined origin)')
    return
  }

  if (request.protocol !== 'frankly;v1') {
    console.log('frankly widgets received an invalid request for protocol', request.protocol)
    return
  }

  if (request.type !== 'request') {
    return
  }

  method = methods[request.method]

  if (method === undefined) {
    console.log('frankly widgets received an invalid request for method', request.method)
    return
  }

  method(request, source, origin)
      .then(function (result) { success(result, request, source, origin) })
      .catch(function (error) { failure(error, request, source, origin) })
})

module.exports = {
  init: function (options) {
    var element  = undefined
    var previous = undefined
    var key      = undefined
    var pending  = undefined

    if (options === undefined) {
      options = { }
    } else {
      options = copyConfig(options)
    }

    // Lookup the window associated with the provided id (if any).
    if (options.id === undefined) {
      options.window = undefined
    } else {
      element = document.getElementById(options.id)

      if (element === undefined) {
        throw new Error("no element with id " + options.id + " could be found")
      }

      if (element.contentWindow === undefined) {
        throw new Error("the element with id " + options.id + " is not an iframe")
      }

      if (getConfigByWindow(undefined) !== undefined) {
        throw new Error("the default configuration has already been set, no more calls to frankly.widgets.init can be made")
      }

      options.window = element.contentWindow
    }

    // Check if we had registered a previously configuration for that
    // window, there are two cases where that may happen:
    //
    // - one of the windows has already loaded and is waiting for
    // configuration, this is valid case and we'll complete it when
    // we're done setting up the configuration.
    //
    // - the frankly.widgets.init function was called multiple times
    // by the host page and we'll throw an error.
    previous = getConfigByWindow(options.window)

    if (previous === undefined) {
      configs.push(options)
    } else {
      if (previous.ready) {
        throw new Error("multiple calls to frankly.widgets.init for the same configuration were detected")
      }

      for (key in options) {
        previous[key] = options[key]
      }

      options = previous
    }

    options.ready = true

    if (options.window !== undefined) {
      // If there are pending windows waiting for this configuration
      // to become available we notify them all.
      notifyConfigReady(options)
    } else {
      // If the default configuration is being set we notify pending
      // windows for all configurations.
      for (key in configs) {
        notifyConfigReady(configs[key])
      }
    }
  }
}
