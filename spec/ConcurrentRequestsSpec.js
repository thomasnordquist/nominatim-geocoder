const Nominatim = require('../index')
const ServerMock = require('mock-http-server')

describe('Requests should', () => {
  const nominatim = new Nominatim({ delay: 0 })

  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'

  const previousHost = nominatim.options.host
  const previousHostSecure = nominatim.options.secure

  const delayForEachRequest = 500
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
    setupServer()
    Nominatim.setupQueue(4, Infinity)
    server.start(done)
    nominatim.options.host = host
    nominatim.options.secure = false
  })

  afterEach((done) => {
    server.stop(done)
    Nominatim.setupQueue(1, Infinity)
    nominatim.options.host = previousHost
    nominatim.options.secure = previousHostSecure
  })

  it('be concurrent', (done) => {
    const start = new Date()

    nominatim.search({ q: 'test concurrent 1' })
    nominatim.search({ q: 'test concurrent 2' })
    nominatim.search({ q: 'test concurrent 3' })
    nominatim.search({ q: 'test concurrent 4' }).then(() => {
      const end = new Date()
      const requestsAreConcurrent = (end - start) < (2 * delayForEachRequest)
      expect(requestsAreConcurrent).toBe(true, 'Requests are note concurrent')
      done()
    })
  })
})
