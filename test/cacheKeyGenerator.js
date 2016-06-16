'use strict';

let expect    = require('expect.js');
let generator = require('../src/cacheKeyGenerator');

describe('cacheKeyGenerator', () => {
    describe('given custom partition and varyByHeaders', () => {
        it('should generate cache key with custom partition, method, path and filtered headers', () => {
            let req = {
                route: {
                    method: 'get'
                },
                url: {
                    path: '/resource'
                },
                headers: {
                    a: 'a',
                    'Accept-Language': 'en-au, en-us,  en',
                    b: 'b',
                    accept: 'text/html',
                    c: 'c'
                }
            };

            let options = {
                partition: 'test',
                varyByHeaders: ['Accept', 'accept-language', 'accept-encoding']
            };

            expect(generator.generateCacheKey(req, options)).to.equal('test|get|/resource|accept=text/html|accept-language=en-au,en-us,en');
        });
    });

    describe('given no partition', () => {
        it('should generate cache key with "default" partition, method, path and filtered headers', () => {
            let req = {
                route: {
                    method: 'get'
                },
                url: {
                    path: '/resource'
                }
            };

            let options = {
                partition: undefined,
                varyByHeaders: ['Accept', 'accept-language', 'accept-encoding']
            };

            expect(generator.generateCacheKey(req, options)).to.equal('default|get|/resource');
        });
    });

    describe('given no varyByHeaders', () => {
        it('should generate cache without headers', () => {
            let req = {
                route: {
                    method: 'get'
                },
                url: {
                    path: '/resource'
                },
                headers: {
                    accept: 'text/html',
                    'accept-language': 'en-au, en-us, en'
                }
            };

            let options = {
                partition: 'test',
                varyByHeaders: undefined
            };

            expect(generator.generateCacheKey(req, options)).to.equal('test|get|/resource');
        });
    });
});
