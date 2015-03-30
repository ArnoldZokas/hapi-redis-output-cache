'use strict';

var expect = require('expect.js'),
    plugin = require('../index.js');

describe('plugin option validation', function() {
    describe('given null host', function() {
        it('should return error', function () {
            plugin.register(null, { staleIn: 1, expiresIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is required]');
            });
        });
    });

    describe('given empty host', function() {
        it('should return error', function () {
            plugin.register(null, { host: '', staleIn: 1, expiresIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is not allowed to be empty]');
            });
        });
    });

    describe('given non-array varyByHeaders', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', varyByHeaders: 'string', staleIn: 1, expiresIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "varyByHeaders" fails because ["varyByHeaders" must be an array]');
            });
        });
    });

    describe('given null staleIn', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', expiresIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "staleIn" fails because ["staleIn" is required]');
            });
        });
    });

    describe('given 0 staleIn', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', staleIn: 0, expiresIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "staleIn" fails because ["staleIn" must be larger than or equal to 1]');
            });
        });
    });

    describe('given null expiresIn', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "expiresIn" fails because ["expiresIn" is required]');
            });
        });
    });

    describe('given 0 expiresIn', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 0 }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "expiresIn" fails because ["expiresIn" must be larger than or equal to 1]');
            });
        });
    });

    describe('given invalid onCacheMiss handler', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 1, onCacheMiss: '' }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "onCacheMiss" fails because ["onCacheMiss" must be a Function]');
            });
        });
    });

    describe('given invalid onError handler', function() {
        it('should return error', function () {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 1, onError: '' }, function(err) {
                expect(err.toString()).to.equal('ValidationError: child "onError" fails because ["onError" must be a Function]');
            });
        });
    });
});