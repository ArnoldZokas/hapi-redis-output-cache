'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (cold cache; non-cacheable, successful GET request)', () => {
    let response;

    before(next => {
        redisHelper.reset();

        fauxServer(server => {
            server.request({
                url: '/non-cacheable-successful-request',
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
