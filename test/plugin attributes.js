'use strict';

var expect = require('expect.js'),
    plugin = require('../index.js');

describe('plugin attributes', function() {
    it('should contain name', function () {
        expect(plugin.register.attributes.name).to.equal('hapi-redis-output-cache');
    });

    it('should contain version', function () {
        expect(plugin.register.attributes.version).to.equal('1.0.3');
    });
});