'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe.only('plugin (cold cache; cacheable, successful request)', () => {
    let response;

    before(next => {
        redisHelper.reset();

        fauxServer(server => {
            server.request({
                url: '/cacheable-successful-request',
                headers: {
                    'Accept-Language': "de-DE, de, en"
                }
            }, r => {
                response = r;
                next();
            });
        });
    });

    it('should return status 200', () => {
        expect(response.statusCode).to.be(200);
    });

    it('should return content-type header', () => {
        expect(response.headers['content-type']).to.be('application/json; charset=utf-8');
    });

    it('should cache response status code', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.statusCode).to.be(200);
            next();
        });
    });

    it('should cache response headers', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.headers).to.eql({ 'content-language': 'de-DE' });
            next();
        });
    });

    it('should cache response payload', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.payload).to.eql({ test: true });
            next();
        });
    });

    it('should set expiry timestamp', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.expiresOn).to.greaterThan(Math.floor(new Date() / 1000));
            next();
        });
    });

    it('should trigger cache miss event', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(response.request.context.cacheMiss).to.be(true);
            next();
        });
    });
});

// Test Scenarios:
// - cold cache
//     - ✔ does it write to cache?
//     - does it ignore non-GET requests when reading
//     - does it ignore non-GET requests when writing
//     - does it ignore non-2xx responses when writing
//     - does it ignore errored responses when writing
//     - does it execute onCacheMiss handler?
//     - does it ignore non-cacheable requests
// - stale cache
//     - does it read from cache?
//     - does it avoid executing route handler
//     - does it write to cache?
//     - does it avoid executing onCacheMiss handler?
// - warm cache
//     - does it read from cache?
//     - does it avoid executing route handler
//     - does it avoid writing to cache
//     - does it avoid executing onCacheMiss handler?
// - offline cache
//     - does it handle disconnect?
//     - does it handle reconnect?
//     - handle bad cache miss handlers