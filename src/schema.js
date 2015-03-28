'use strict';

var joi = require('joi');

module.exports = {
    host: joi.string().required(),
    port: joi.number().min(1),
    ttl: joi.number().min(1).required(),
    onCacheMiss: joi.func()
};