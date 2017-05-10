const Nominatim = require('../index')
const ServerMock = require('mock-http-server')

describe('It should be possible to change the api endpoint', () => {
  const nominatim = new Nominatim({ delay: 0 })
  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'
  const delayForEachRequest = 200

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

  it('host can be changed', (done) => {
    nominatim.search({ q: 'something' }).then((response) => {
      expect(typeof response).toBe('object')
      expect(response.secret).toBe('response from mock server')
      done()
    })
  })
})
