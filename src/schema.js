'use strict';

var joi = require('joi');

module.exports = {
    host: joi.string().required(),
    port: joi.number().min(1),
    varyByHeaders: joi.array(),
    partition: joi.string(),
    staleIn: joi.number().min(1).required(),
    expiresIn: joi.number().min(1).required(),
    onCacheMiss: joi.func(),
    onError: joi.func()
};
