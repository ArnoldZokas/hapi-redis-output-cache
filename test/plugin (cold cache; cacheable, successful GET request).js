'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (cold cache; cacheable, successful GET request)', () => {
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
        expect(response.request.context.cacheMiss).to.be(true);
        next();
    });
});
