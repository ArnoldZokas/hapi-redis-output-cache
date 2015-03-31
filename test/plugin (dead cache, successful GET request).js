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

describe('plugin (dead cache, successful GET request)', function() {
    before(function(done) {
        redis.flushdb();

        redis.set('get|/resources/1|{\"accept\":\"application/json\"}', JSON.stringify({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            payload: { test: true },
            expiresOn: Math.floor(new Date() / 1000) + 60
        }));

        plugin.register(server, {
            host: '127.0.0.1',
            port: 9999,
            staleIn: 60,
            expiresIn: 60,
            onCacheMiss: function() { onCacheMissHandlerInvoked = true; }
        }, function() {
            done();
        });
    });

    describe('given dead cache', function() {
        var req = Hoek.clone(requestPrototype);

        describe('when onPreHandler is executed', function() {
            before(function(done) {
                var reply = function() {
                    return {
                        'code': function() {},
                        'header': function() {}
                    };
                };
                reply.continue = function() { done(); };
                server.onPreHandler(req, reply);
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