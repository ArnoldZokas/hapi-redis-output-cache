'use strict';

var expect = require('expect.js'),
    Hoek   = require('hoek'),
    plugin = require('../index.js'),
    redis  = require('redis').createClient(1234, '127.0.0.1');

var originalHandler           = function() {},
    onCacheMissHandlerInvoked = false;

var requestPrototype = {
        headers: {
            accept: 'application/json',
            connection: 'keep-alive'
        },
        route: {
            method: 'get',
            settings: {
                handler: originalHandler,
                plugins: {
                  'hapi-redis-output-cache': { isCacheable: true }
                }
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

describe.skip('plugin (warm cache, successful GET request with non-whitelisted header)', function() {
    before(function(done) {
        redis.flushdb();

        redis.set('|get|/resources/1|accept=application/json', JSON.stringify({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            payload: { test: true },
            expiresOn: Math.floor(new Date() / 1000) + 60
        }));

        plugin.register(server, {
            host: '127.0.0.1',
            port: 1234,
            varyByHeaders: ['accept'],
            staleIn: 60,
            expiresIn: 60,
            onCacheMiss: function() { onCacheMissHandlerInvoked = true; }
        }, function() {
            done();
        });
    });

    describe('given warm cache', function() {
        var req = Hoek.clone(requestPrototype);

        describe('when onPreHandler is executed', function() {
            before(function(done) {
                var reply = function() {
                    return {
                        'code': function() {},
                        'header': function() { done(); }
                    };
                };
                server.onPreHandler(req, reply);
            });

            it('should mark output cache as live', function() {
                expect(req.outputCache.isStale).to.equal(false);
            });

            it('should set output cache data to cached value', function() {
                expect(req.outputCache.data.statusCode).to.equal(200);
            });

            it.skip('should override original route handler', function(done) {
                req.route.settings.handler(null, function(payload) {
                    expect(payload.test).to.equal(true);

                    return {
                        code: function(code) {
                            expect(code).to.equal(200);
                        },
                        header: function(key, value) {
                            expect(key).to.equal('content-type');
                            expect(value).to.equal('application/json');
                            done();
                        }
                    };
                });
            });
        });

        describe('when onPreResponse is executed', function() {
            before(function(done) {
                req.response = {};

                var reply = function() {};
                reply.continue = function() { done(); };
                server.onPreResponse(req, reply);
            });

            it('should not invoke onCacheMiss handler', function() {
                expect(onCacheMissHandlerInvoked).to.equal(false);
            });
        });
    });
});
