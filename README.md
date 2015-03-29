# hapi-redis-output-cache
> Redis-backed output cache module for Hapi

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
            ttl: 60
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
- **host** - hostname or IP address of the redis server
- **port** - *(optional)* port of the redis server; defaults to 6379
- **ttl** - lifespan of a cached response, in seconds
- **onCacheMiss** - *(optional)* function which is invoked on each cache write; useful for tracking cache miss rates in a service
- **onError** - *(optional)* function which is invoked on each redis error

## Release History
* **v0.1.0** (2015-03-29)
 * initial release

##Contributors
* [@orlando80](https://github.com/orlando80)
