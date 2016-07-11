'use strict';

const expect      = require('expect.js');
const redisHelper = require('./redisHelper');
const fauxServer  = require('./fauxServer');

describe('plugin (cold cache; cacheable, failed GET request)', () => {
    let response;

    before(next => {
        redisHelper.reset();

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

    it('should return status 500', () => {
        expect(response.statusCode).to.be(500);
    });

    it('should not cache response', next => {
        redisHelper.get(response.request, reply => {
            expect(reply).to.be(null);
            next();
        });
    });

    it('should not trigger cache miss event', next => {
        expect(response.request.context).to.not.be.ok();
        next();
    });
});
