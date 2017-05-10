const sha1 = require('sha1')

class Query {
  hash() {
    return sha1(JSON.stringify(this))
  }

  // Axios needs a plain object
  plainObject() {
    return JSON.parse(JSON.stringify(this))
  }
}

module.exports = Query
