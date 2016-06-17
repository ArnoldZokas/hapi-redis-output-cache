'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (cold cache; cacheable, successful POST request)', () => {
    let response;

    before(next => {
        redisHelper.reset();

        fauxServer(server => {
            server.request({
                method: 'POST',
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

    it('should not cache response', next => {
        var cachedResponse = redisHelper.get(response.request, reply => {
            expect(reply).to.be(null);
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
//     - does it ignore non-GET requests when reading
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
//     - does it read from cache?
//     - does it avoid executing route handler
//     - does it avoid writing to cache
//     - does it avoid executing onCacheMiss handler?
// - offline cache
//     - does it handle disconnect?
//     - does it handle reconnect?
//     - handle bad cache miss handlers