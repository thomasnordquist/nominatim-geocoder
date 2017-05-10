const Nominatim = require('../index')
const ServerMock = require('mock-http-server')

describe('Test rate limiting: ', () => {
  const rateLimitDelay = 300
  const nominatim = new Nominatim({ delay: rateLimitDelay })
  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'

  const delayForEachRequest = 0
  const previousHost = nominatim.options.host
  const previousHostSecure = nominatim.options.secure

  function setupServer() {
    // Mock response
    server.on({
      method: 'GET',
      path: '/search',
      reply: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body(req, reply) {
          setTimeout(() => {
            reply('{"secret": "response from mock server"}')
          }, delayForEachRequest)
        },
      },
    })
  }

  beforeEach((done) => {
    server.start(done)
    setupServer()
    nominatim.options.host = host
    nominatim.options.secure = false
  })

  afterEach((done) => {
    server.stop(done)
    nominatim.options.host = previousHost
    nominatim.options.secure = previousHostSecure
  })

  it('Rate limit should work', (done) => {
    const start = new Date()

    nominatim.search({ q: 'ratelimit 1' })
    nominatim.search({ q: 'ratelimit 2' })
    nominatim.search({ q: 'ratelimit 3' }).then(() => {
      const end = new Date()
      const success = (end - start) >= (3 * rateLimitDelay)
      expect(success).toBe(true)
      done()
    })
  })

  it('cached querys should not be delayed', (done) => {
    const start = new Date()

    nominatim.search({ q: 'ratelimit cache test' })
    nominatim.search({ q: 'ratelimit cache test' })
    nominatim.search({ q: 'ratelimit cache test' }).then(() => {
      const end = new Date()
      const success = end - start < (2 * rateLimitDelay)
      expect(success).toBe(true)
      done()
    })
  })
})
