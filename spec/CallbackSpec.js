const NominatimCallback = require('../index').NominatimCallback
const ServerMock = require('mock-http-server')

describe('Callback should work', () => {
  const nominatim = new NominatimCallback({ delay: 0 })
  const delayForEachRequest = 100
  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'

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

  it('callback works', (done) => {
    nominatim.search({ q: 'callback test' }, {}, (error, response) => {
      expect(response.secret).toBe('response from mock server')
      done()
    })
  })
})
