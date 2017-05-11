const Query = require('./model/Query')

const axios = require('axios')
const Cache = require('lru')
const Queue = require('promise-queue')

const defaultConcurrency = 1
const defaultMaxQueueLength = Infinity
const cacheSize = 100000

// Context is shared across different modules
const SingletonContext = {
  queue: new Queue(defaultConcurrency, defaultMaxQueueLength),
  cache: new Cache(cacheSize),
}

class Nominatim {
  constructor(options, queryOptions) {
    const defaultOptions = {
      secure: false, // enables ssl
      host: 'nominatim.openstreetmap.org',
      customUrl: undefined, // if you want to host your own nominatim
      cache: true,
      delay: 1000, // Delay between requests
    }

    const queryDefaults = {
      format: 'json',
      limit: 3,
    }

    this.options = Object.assign({}, defaultOptions, options)
    this.queryDefaults = Object.assign({}, queryDefaults, queryOptions)
  }

  static setupCache(size) {
    // Just to be sure the memory will be freed
    if (SingletonContext.cache) {
      SingletonContext.cache.clear()
    }

    SingletonContext.cache = new Cache(size)
  }

  static setupQueue(concurrency, maxQueueLength) {
    SingletonContext.queue = new Queue(
      concurrency || defaultConcurrency,
      maxQueueLength || defaultMaxQueueLength)
  }


  protocol(options) {
    return options.secure ? 'https' : 'http'
  }

  buildUrl(options, slug) {
    if (options.customUrl) {
      return options.customUrl + slug
    }

    return this.protocol(options) + '://' + options.host + slug
  }

  search(query, options) {
    // Merge options
    const opt = Object.assign({}, this.options, options)
    const url = this.buildUrl(opt, '/search')
    return this.query(url, query)
  }

  reverse(query, options) {
    // Merge options
    const opt = Object.assign({}, this.options, options)
    const url = this.buildUrl(opt, '/reverse')
    return this.query(url, query)
  }

  query(url, query) {
    const queryObject = Object.assign(new Query(), this.queryDefaults, query)
    const cacheHitInformation = { hit: false }

    return SingletonContext.queue.add(() => {
      const promise = new Promise((resolve, reject) => {
        let cachedResponse
        if (cachedResponse = SingletonContext.cache.get(queryObject.hash())) {
          cacheHitInformation.hit = true
          resolve(cachedResponse)
          return
        }

        axios.get(url, { params: queryObject.plainObject() })
          .then((response) => {
            resolve(response.data)
          })
          .catch((error) => {
            SingletonContext.cache.remove(queryObject.hash())
            reject(error)
          })
      })

      const delayedPromise = this.delayPromise(promise, cacheHitInformation)

      // Store promise in cache, resolved promises are self-unwrapping
      SingletonContext.cache.set(queryObject.hash(), delayedPromise)
      return delayedPromise
    })
  }

  // This method wraps a promise, it waits after a promise is resolved/rejected
  // and resolves the outer promise when the remaing time after delayBetweenRequests
  // has passed. Quite a hack...
  // ToDo: Replace
  // Note: Rate limiting is subject to the jasmine tests
  delayPromise(promise, cacheHitInformation) {
    const start = new Date()

    const handleEndedPromise = (action, responseOrError) => {
      const end = new Date()

      const timeToWait = this.options.delay - (end - start)
      const isFromCache = cacheHitInformation.hit

      if (timeToWait > 0 && !isFromCache) {
        setTimeout(() => action(responseOrError), timeToWait)
      } else {
        action(responseOrError) // immediate resolve
      }
    }

    return new Promise((resolve, reject) => {
      promise.then((response, query, test) => {
        handleEndedPromise(resolve, response)
      }).catch((error, query) => {
        handleEndedPromise(reject, error)
      })
    })
  }
}

// Wrapper for those who prefer callbacks
class NominatimCallbackWrapper extends Nominatim {
  search(query, options, callback) {
    const promise = super.search(query, options)
    return this.handlePromise(promise, callback)
  }

  reverse(query, options, callback) {
    const promise = super.reverse(query, options)
    return this.handlePromise(promise, callback)
  }

  handlePromise(promise, callback) {
    if (typeof callback === 'function') {
      return this.wrapPromiseWithCallback(promise, callback)
    }

    return promise
  }

  wrapPromiseWithCallback(promise, callback) {
    return promise
      .then((data, query) => callback(undefined, data))
      .catch((error, query) => callback(error, undefined))
  }
}

Nominatim.Nominatim = Nominatim // hack to have a default and named exports
Nominatim.NominatimCallback = NominatimCallbackWrapper
Nominatim.NominatimSingletonContext = SingletonContext
Nominatim.NominatimCache = Cache
Nominatim.NominatimQueue = Queue

module.exports = Nominatim
