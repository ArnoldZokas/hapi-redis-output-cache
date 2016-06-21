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
                expiresOn: Math.floor(new Date() / 1000) + 30
            }
        });

        fauxServer(null, server => {
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

    it('should return cached payload', () => {
        expect(JSON.parse(response.payload)).to.eql({ fromCache: true, id: 1, test: true });
    });

    it('should not trigger cache miss event', () => {
        expect(response.request.context).to.not.be.ok();
    });

    it('should return generated payload for cold request', () => {
        expect(JSON.parse(response2.payload)).to.eql({ id: 2, test: true });
    });
});
