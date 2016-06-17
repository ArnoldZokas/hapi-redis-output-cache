'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (warm cache; cacheable, successful GET request)', () => {
    let response;
    let response2;

    before(next => {
        redisHelper.reset({
            key: 'test|get|/cacheable-successful-request/1',
            value: {
                statusCode: 200,
                headers: { 'content-language': 'de-DE' },
                payload: { test: true, id: 1, fromCache: true },
                expiresOn: 1466181192
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

                server.request({
                    url: '/cacheable-successful-request/2',
                    headers: {
                        'Accept-Language': "de-DE, de, en"
                    }
                }, r => {
                    response2 = r;
                    next();
                });
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

    it('should return cached payload', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply.payload).to.eql({ fromCache: true, id: 1, test: true });
            next();
        });
    });

    it('should not trigger cache miss event', next => {
        expect(response.request.context).to.not.be.ok();
        next();
    });

    it('should return generated payload for cold request', () => {
        expect(JSON.parse(response2.payload)).to.eql({ id: 2, test: true });
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
//     - does it read from cache?
//     - does it avoid executing route handler
//     - does it write to cache?
//     - does it avoid executing onCacheMiss handler?
// - warm cache
//     - ✔ does it read from cache?
//     - ✔ does it avoid executing route handler
//     - ✔ does it avoid writing to cache
//     - ✔ does it avoid executing onCacheMiss handler?
// - offline cache
//     - does it handle disconnect?
//     - does it handle reconnect?
//     - handle bad cache miss handlers
