'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (stale cache; cacheable, successful GET request)', () => {
    let response;
    let response2;

    before(next => {
        redisHelper.reset({
            key: 'test|get|/cacheable-successful-request/1',
            value: {
                statusCode: 200,
                headers: { 'content-language': 'de-DE' },
                payload: { test: true, id: 1, fromCache: true },
                expiresOn: Math.floor(new Date() / 1000) - 10
            }
        });

        fauxServer(server => {
            server.request({
                url: '/cacheable-successful-request/1',
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

    it('should return content-language header', () => {
        expect(response.headers['content-language']).to.be('de-DE');
    });

    it('should return generated payload', () => {
        expect(JSON.parse(response.payload)).to.eql({ id: 1, test: true });
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
            expect(reply.payload).to.eql({ id: 1, test: true });
            next();
        });
    });

    it('should set expiry timestamp', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.expiresOn).to.greaterThan(Math.floor(new Date() / 1000));
            next();
        });
    });

    it('should set ttl', next => {
        var cachedResponse = redisHelper.ttl(response.request, reply => {
            expect(reply).to.be(60);
            next();
        });
    });

    it('should trigger cache miss event', next => {
        expect(response.request.context.cacheMiss).to.be(true);
        next();
    });
});

// Test Scenarios:
// - cold cache
//     - ✔ does it write to cache?
//     - ✔ does it ignore non-GET requests when reading
//     - ✔ does it ignore non-GET requests when writing
//     - ✔ does it ignore non-2xx responses when writing
//     - ✔ does it execute onCacheMiss handler?
//     - ✔ does it ignore non-cacheable requests
// - stale cache
//     - ✔ does it read from cache?
//     - ✔ does it avoid executing route handler
//     - ✔ does it write to cache?
//     - ✔ does it avoid executing onCacheMiss handler?
//     - does it use stale value in case original handler fails?
// - warm cache
//     - ✔ does it read from cache?
//     - ✔ does it avoid executing route handler
//     - ✔ does it avoid writing to cache
//     - ✔ does it avoid executing onCacheMiss handler?
// - offline cache
//     - does it handle disconnect?
//     - does it handle reconnect?
//     - handle bad cache miss handlers
