# Install
```
npm install --save nominatim-geocoder
```

### Why yet another geocoder library ?
I needed a library which respects the [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) and is capable of custom api endpoints.
[Installing Nominatim](https://wiki.openstreetmap.org/wiki/Nominatim/Installation) itself is a pretty simple task and should be considered for a bigger workload.

If you are familiar with docker, [nominatim-docker](https://github.com/mediagis/nominatim-docker) might be woth a look.

# Usage
[Nominatim Query parameters](http://wiki.openstreetmap.org/wiki/Nominatim#Parameters)

_Pro tip: In case of well structured data queries like `{country: 'de',  postalcode='10115', street='Somestreet XX'}` instead of `{q: 'Somestreet XX, 10115 Berlin'}` perform much faster_

### Promises
```
const Nominatim = require('nominatim-geocoder')
const geocoder = Nominatim()

geocoder.search( { q: 'Berlin, Germany' } )
    .then((response) => {
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
```

### Callback
```
const Nominatim = require('nominatim-geocoder').NominatimCallback
const geocoder = Nominatim()

geocoder.search( { q: 'Berlin, Germany' }, function(error, response) {
  console.log(error, response)
})
```

### Response
The response will be either an empty array `[]`, or an array with matches.
```
[{
    "place_id": "159261664",
    "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright",
    "osm_type": "relation",
    "osm_id": "1402156",
    "boundingbox": ["52.5237693", "52.5401484", "13.3658603", "13.4012965"],
    "lat": "52.53195385",
    "lon": "13.3838001271759",
    "display_name": "Mitte, Berlin, 10115, Deutschland",
    "class": "place",
    "type": "postcode",
    "importance": 0.435
}, ...]
```

## Configuration
### Custom API endpoint
You can set `customUrl` to your endpoint.
This will override the `host` and `secure` options.
```
const Nominatim = require('nominatim-geocoder')

const geocoder = Nominatim({
  secure: false, // enables ssl
  host:'nominatim.openstreetmap.org',
  customUrl: 'http://your-own-nominatim/', // if you want to host your own nominatim
})
```

### Overwrite default query parameters
```
const Nominatim = require('nominatim-geocoder')

const geocoder = Nominatim({/* No options */}, {
  format: 'json',
  limit: 3,
})
```

## Good to know

- All requests are cached with the LRU strategy (Least recently used), the datastructure is HashMap (average complexity O(n))

- Even though search calls are asynchronous, they will be executed one after anouther via a queue

- All instances of nominatim share the same cache and execution queue. This means the library can be used across modules without being passed down and still adhere to the Usage Polics
