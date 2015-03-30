'use strict';

var expect = require('expect.js'),
    Hoek   = require('hoek'),
    plugin = require('../index.js'),
    redis  = require('redis').createClient(1234, '127.0.0.1');

var originalHandler           = function() {},
    onCacheMissHandlerInvoked = false;

var requestPrototype = {
        headers: {
            accept: 'application/json'
        },
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

        describe('when onPreResponse is executed', function() {
            var cachedResponse;

            before(function(done) {
                req.response = {};

                server.onPreResponse(req, {
                    'continue': function() {
                        redis.get('get|/resources/1', function(err, data) {
                            cachedResponse = data;
                            done();
                        });
                    }
                });
            });

            it('should not invoke onCacheMiss handler', function() {
                expect(onCacheMissHandlerInvoked).to.equal(false);
            });

            it('should not cache failed response', function() {
                expect(cachedResponse).to.equal(null);
            });
        });
    });
});