beforeEach(() => {
  jasmine.addMatchers({
    toBeValidLocationData() {
      return {
        compare: data => ({
          pass: typeof data === 'object'
            && data[0] !== undefined
            && !isNaN(parseFloat(data[0].lat))
            && !isNaN(data[0].lon),
        }),
      }
    },
  })
})
