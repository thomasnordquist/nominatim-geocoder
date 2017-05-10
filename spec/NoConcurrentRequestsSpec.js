const Nominatim = require('../index')
const ServerMock = require('mock-http-server')

describe('Requests shouldn\'t be concurrent', () => {
  const nominatim = new Nominatim({ delay: 0 })

  const server = new ServerMock({ host: 'localhost', port: 34512 })
  const host = 'localhost:34512'

  const previousHost = nominatim.options.host
  const previousHostSecure = nominatim.options.secure

  beforeEach((done) => {
    server.start(done)
    nominatim.options.host = host
    nominatim.options.secure = false
  })

  afterEach((done) => {
    server.stop(done)
    nominatim.options.host = previousHost
    nominatim.options.secure = previousHostSecure
  })

  it('should do something', (done) => {
    const delayForEachRequest = 200
    const start = new Date()

    // Mock response
    server.on({
      method: 'GET',
      path: '/search',
      reply: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body(req, reply) {
          setTimeout(() => {
            reply('{"a": ' + Math.random() + '}')
          }, delayForEachRequest)
        },
      },
    })

    nominatim.search({ q: 'no concurrent 1' })
    nominatim.search({ q: 'no concurrent 2' })
    nominatim.search({ q: 'no concurrent 3' })
    nominatim.search({ q: 'no concurrent 4' }).then(() => {
      const end = new Date()
      const tookExpectedTime = (end - start) >= (4 * delayForEachRequest)
      if (!tookExpectedTime) {
        expect('requests to be synchronous').toBe('true')
      }
      done()
    })
  })
})
