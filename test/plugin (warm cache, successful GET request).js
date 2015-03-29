'use strict';

var expect = require('expect.js'),
    Hoek   = require('hoek'),
    plugin = require('../index.js'),
    redis  = require('redis').createClient(1234, '127.0.0.1');

var originalHandler           = function() {},
    onCacheMissHandlerInvoked = false;

var requestPrototype = {
        route: {
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

describe('plugin (warm cache, successful GET request)', function() {
    before(function(done) {
        redis.set('get|/resources/1', JSON.stringify({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            payload: { test: true },
            expiresOn: Math.floor(new Date() / 1000) + 60
        }));

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

            it('should mark output cache as live', function() {
                expect(req.outputCache.isStale).to.equal(false);
            });

            it('should set output cache data to cached value', function() {
                expect(req.outputCache.data.statusCode).to.equal(200);
            });

            it('should override original route handler', function(done) {
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

                server.onPreResponse(req, { 'continue': function() { done(); } });
            });

            it('should not invoke onCacheMiss handler', function() {
                expect(onCacheMissHandlerInvoked).to.equal(false);
            });
        });
    });
});