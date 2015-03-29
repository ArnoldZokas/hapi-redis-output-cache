'use strict';

var expect = require('expect.js'),
    Hoek   = require('hoek'),
    plugin = require('../index.js'),
    redis  = require('redis').createClient(1234, '127.0.0.1');

var originalHandler           = function() {},
    onCacheMissHandlerInvoked = false;

var requestPrototype = {
        route: {
            headers: {
                accept: 'application/json'
            },
            method: 'get',
            settings: {
                handler: originalHandler
            }
        },
        url: {
            path: '/resources/1'
        }
    };

var server = {
        ext: function(name, handler) {
            this[name] = handler;
        }
    };

describe('plugin (cold cache, successful GET request)', function() {
    before(function(done) {
        redis.del('get|/resources/1|{\"accept\":\"application/json\"}');

        plugin.register(server, {
            host: '127.0.0.1',
            port: 1234,
            ttl: 60,
            onCacheMiss: function() { onCacheMissHandlerInvoked = true; }
        }, function() {
            done();
        });
    });

    describe('given cold cache', function() {
        var req = Hoek.clone(requestPrototype);

        describe('when onPreHandler is executed', function() {
            before(function(done) {
                server.onPreHandler(req, { 'continue': function() { done(); } });
            });

            it('should mark output cache as stale', function() {
                expect(req.outputCache.isStale).to.equal(true);
            });

            it('should set output cache data to null', function() {
                expect(req.outputCache.data).to.equal(null);
            });

            it('should not override original route handler', function() {
                expect(req.route.settings.handler).to.equal(originalHandler);
            });
        });

        describe('when onPreResponse is executed', function() {
            var cachedResponse;

            before(function(done) {
                req.response = {
                    statusCode: 200,
                    headers: { 'content-type': 'application/json' },
                    source: { test: true }
                };

                server.onPreResponse(req, {
                    'continue': function() {
                        redis.get('get|/resources/1|{\"accept\":\"application/json\"}', function(err, data) {
                            cachedResponse = JSON.parse(data);
                            done();
                        });
                    }
                });
            });

            it('should invoke onCacheMiss handler', function() {
                expect(onCacheMissHandlerInvoked).to.equal(true);
            });

            it('should cache response status code', function() {
                expect(cachedResponse.statusCode).to.equal(200);
            });

            it('should cache response headers', function() {
                expect(cachedResponse.headers['content-type']).to.equal('application/json');
            });

            it('should cache response payload', function() {
                expect(cachedResponse.payload.test).to.equal(true);
            });

            it('should cache response expiry timestamp', function() {
                expect(cachedResponse.expiresOn).to.be.lessThan(Math.floor(new Date() / 1000) + 61);
            });
        });
    });
});