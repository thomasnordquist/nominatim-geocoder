const ServerMock = require('mock-http-server')
const Nominatim = require('../index')

function startAndEndAreWithinRange(start, end, range) {
  return end - range >= start
}

describe('Cache should work properly', () => {
  const nominatim = new Nominatim({ delay: 0 })

  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'

  const previousHost = nominatim.options.host
  const previousHostSecure = nominatim.options.secure

  let originalTimeout

  beforeEach((done) => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000
    nominatim.options.host = host
    nominatim.options.secure = false
    server.start(done)
    configureServer()
  })

  afterEach((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
    nominatim.options.host = previousHost
    nominatim.options.secure = previousHostSecure
    server.stop(done)
  })

  const delayForEachRequest = 200
  function configureServer() {
    // Mock response
    server.on({
      method: 'GET',
      path: '/search',
      reply: {
        status: req => (req.query.fail ? 500 : 200),
        headers: { 'content-type': 'application/json' },
        body(req, reply) {
          setTimeout(() => {
            reply('{"secret": ' + Math.random() + '}')
          }, delayForEachRequest)
        },
      },
    })
  }

  let firstCachedResult
  it('first request create cache entry', (done) => {
    nominatim.search({ q: 'Cache test 123' })
      .then((data) => {
        firstCachedResult = data.secret
        done()
      })
  })

  // We verify if it was cached by runtime, a mocked request takes about 200ms
  // if it is faster it must be a cache hit
  it('second request should be cached', (done) => {
    const TEN_MILLISECONDS = 10
    const start = new Date()
    nominatim.search({ q: 'Cache test 123' })
      .then((data) => {
        const end = new Date()

        // Test the expected data
        expect(data.secret).toBe(firstCachedResult)

        // Test if it fits the time criteria
        if (startAndEndAreWithinRange(start, end, TEN_MILLISECONDS)) {
          expect('to be cached').toBe('true')
        }

        done()
      })
  })

  // This test should take just a bit longer then a single request
  it('request can be cached before they are finished', (done) => {
    const start = new Date()
    nominatim.search({ q: 'subsequent cache test', limit: 1 })
    nominatim.search({ q: 'subsequent cache test', limit: 1 })
    nominatim.search({ q: 'subsequent cache test', limit: 1 }).then(() => {
      const end = new Date()
      // We have 3 requests, succes => faster than 2 requests
      const success = (end - start) < 2 * delayForEachRequest
      expect(success).toBe(true,
          'subsequent requests took too long ' +
          (end - start) + ' instead of < ' +
          (2 * delayForEachRequest))

      done()
    })
  })

  // A request shoud be attempted again if an error has occurred
  it('failing requests should not be cached', (done) => {
    const start = new Date()
    nominatim.search({ q: 'failing request test', fail: true }).catch(() => {})
    nominatim.search({ q: 'failing request test', fail: true }).catch(() => {})
    nominatim.search({ q: 'failing request test', fail: true }).catch(() => {
      const end = new Date()
      // We have 3 requests, succes => faster than 2 requests
      const success = (end - start) >= 3 * delayForEachRequest
      expect(success).toBe(true, 'subsequent failing requests were to fast ' + (end - start) + ' instead of > ' + (2 * delayForEachRequest))
      done()
    })
  })
})
