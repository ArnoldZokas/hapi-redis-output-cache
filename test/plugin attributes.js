'use strict';

const expect = require('expect.js');
const plugin = require('../index.js');

describe('plugin attributes', () => {
    it('should contain name', () => {
        expect(plugin.register.attributes.name).to.equal('hapi-redis-output-cache');
    });

    it('should contain version', () => {
        expect(plugin.register.attributes.version).to.equal('3.0.0-alpha.1');
    });
});
