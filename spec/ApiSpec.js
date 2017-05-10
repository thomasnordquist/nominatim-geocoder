const Nominatim = require('../index')

describe('Test Api', () => {
  const nominatim = new Nominatim({ secure: false })
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

  it('should respond with location data', (done) => {
    nominatim.search({ q: 'Berlin, Germany' }).then((response) => {
      expect(response).toBeValidLocationData()
      done()
    })
  })
})
