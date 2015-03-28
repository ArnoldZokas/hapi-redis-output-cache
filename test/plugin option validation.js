'use strict';

var expect = require('expect.js'),
    plugin = require('../index.js');

describe('plugin option validation', function() {
    describe('given null host', function() {
        it('should return error', function () {
            plugin.register(null, { ttl: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is required]');
            });
        });
    });

    describe('given empty host', function() {
        it('should return error', function () {
            plugin.register(null, { host: '', ttl: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is not allowed to be empty]');
            });
        });
    });

    describe('given null ttl', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1' }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "ttl" fails because ["ttl" is required]');
            });
        });
    });

    describe('given 0 ttl', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', ttl: 0 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "ttl" fails because ["ttl" must be larger than or equal to 1]');
            });
        });
    });

    describe('given invalid onCacheMiss handler', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', ttl: 1, onCacheMiss: '' }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "onCacheMiss" fails because ["onCacheMiss" must be a Function]');
            });
        });
    });
});