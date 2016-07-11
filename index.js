'use strict';

const pkg    = require('./package.json');
const plugin = require('./src/plugin');

exports.register = plugin.register;

exports.register.attributes = {
    name: pkg.name,
    version: pkg.version
};
