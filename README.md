# hapi-redis-output-cache
> Redis-backed output cache plugin for Hapi

[![Build Status](https://semaphoreci.com/api/v1/projects/4d44ffcd-8cdb-4ecf-bcf2-afd9a14bbeff/385104/badge.svg)](https://semaphoreci.com/ArnoldZokas/hapi-redis-output-cache)[![Dependency Status](https://david-dm.org/ArnoldZokas/hapi-redis-output-cache.svg)](https://david-dm.org/ArnoldZokas/hapi-redis-output-cache) [![NPM version](https://badge.fury.io/js/hapi-redis-output-cache.svg)](http://badge.fury.io/js/hapi-redis-output-cache)

[![NPM](https://nodei.co/npm/hapi-redis-output-cache.png?downloads=true&stars=true)](https://nodei.co/npm/hapi-redis-output-cache)

## Usage
```
$ npm i hapi-redis-output-cache --save
```

```
var server = new (require('hapi').Server)();
server.connection({ port: 3000 });

server.register([
    {
        register: require('hapi-redis-output-cache'),
        options: {
            host: '127.0.0.1',
            staleIn: 30,
            expiresIn: 60
        }
    }
], function (err) {
    if (err) {
        console.error('Failed to load plugin:', err);
    }

    server.start();
});
```

## Configuration
- **host** - hostname or IP address of the Redis server
- **port** - *(optional)* port of the Redis server; defaults to 6379
- **varyByHeaders** - *(optional)* an array of headers to be used for generating cache key; defaults no none
- **staleIn** - number of seconds until the cached response will be considered stale and marked for regeneration
- **expiresIn** - number of seconds until the cached response will be purged from Redis
- **onCacheMiss** - *(optional)* function which is invoked on each cache write; useful for tracking cache miss rates in a service
- **onError** - *(optional)* function which is invoked on each Redis error

## Miscellaneous
Output cache metadata is injected into each request and can be access via `req.outputCache`:
- **isStale**: boolean value indicating whether the cache is stale
- **data**: object representing cached response (available even when stale)

## Release History
- **v1.0.0** (2015-03-30)
 - implemented a more sophisticated *freshness* mechanism which allows stale and expired data to be handled separately
 - implemented a whitelist of request headers to be used for generating cache key to provide more fine-grained control over keys
- **v0.2.1** (2015-03-30)
 - fixed handling of responses with failed joi validation
- **v0.2.0** (2015-03-30)
 - fixed cache key algorithm
- **v0.1.0** (2015-03-29)
 - initial release

## Contributors
* [@orlando80](https://github.com/orlando80)
