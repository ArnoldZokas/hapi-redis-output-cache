'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (stale cache; cacheable, failed GET request)', () => {
    let response;

    before(next => {
        redisHelper.reset({
            key: 'test|get|/cacheable-failed-request',
            value: {
                statusCode: 200,
                headers: { 'content-language': 'de-DE' },
                payload: { test: true, fromCache: true },
                expiresOn: Math.floor(new Date() / 1000) - 10
            },
            ttl: 45
        });

        fauxServer(null, server => {
            server.request({
                url: '/cacheable-failed-request',
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

    it('should return cached payload', () => {
        expect(JSON.parse(response.payload)).to.eql({ fromCache: true, test: true });
    });

    it('should not set ttl', next => {
        redisHelper.ttl(response.request, reply => {
            expect(reply).to.be(45);
            next();
        });
    });

    it('should not trigger cache miss event', next => {
        expect(response.request.context).to.not.be.ok();
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
//     - ✔ does it use stale value in case original handler fails?
// - warm cache
//     - ✔ does it read from cache?
//     - ✔ does it avoid executing route handler
//     - ✔ does it avoid writing to cache
//     - ✔ does it avoid executing onCacheMiss handler?
// - offline cache
//     - does it handle start-time disconnect?
//     - does it handle runtime disconnect?
//     - does it handle runtime reconnect?
