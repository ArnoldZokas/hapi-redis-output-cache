'use strict';

const expect = require('expect.js');
const plugin = require('../index.js');

describe('plugin option validation', () => {
    describe('given null host', () => {
        it('should return error', () => {
            plugin.register(null, { staleIn: 1, expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is required]');
            });
        });
    });

    describe('given empty host', () => {
        it('should return error', () => {
            plugin.register(null, { host: '', staleIn: 1, expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "host" fails because ["host" is not allowed to be empty]');
            });
        });
    });

    describe('given invalid port', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', port: 0, staleIn: 1, expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "port" fails because ["port" must be larger than or equal to 1]');
            });
        });
    });

    describe('given invalid partition', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 1, partition: () =>{} }, err => {
                expect(err.toString()).to.equal('ValidationError: child "partition" fails because ["partition" must be a string]');
            });
        });
    });

    describe('given non-array varyByHeaders', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', varyByHeaders: 'string', staleIn: 1, expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "varyByHeaders" fails because ["varyByHeaders" must be an array]');
            });
        });
    });

    describe('given null staleIn', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "staleIn" fails because ["staleIn" is required]');
            });
        });
    });

    describe('given invalid staleIn', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', staleIn: 0, expiresIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "staleIn" fails because ["staleIn" must be larger than or equal to 1]');
            });
        });
    });

    describe('given null expiresIn', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "expiresIn" fails because ["expiresIn" is required]');
            });
        });
    });

    describe('given invalid expiresIn', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 0 }, err => {
                expect(err.toString()).to.equal('ValidationError: child "expiresIn" fails because ["expiresIn" must be larger than or equal to 1]');
            });
        });
    });

    describe('given invalid onCacheMiss handler', () => {
        it('should return error', () => {
            plugin.register(null, { host: '127.0.0.1', staleIn: 1, expiresIn: 1, onCacheMiss: '' }, err => {
                expect(err.toString()).to.equal('ValidationError: child "onCacheMiss" fails because ["onCacheMiss" must be a Function]');
            });
        });
    });
});
