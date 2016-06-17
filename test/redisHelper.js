'use strict';

const cacheKeyGenerator = require('../src/cacheKeyGenerator');
const redis             = require('redis').createClient(1234, '127.0.0.1');

module.exports = {
    reset: () => {
        redis.flushdb();
    },
    get: (req, next) => {
        var key = cacheKeyGenerator.generateCacheKey(req, { partition: 'test' });;

        redis.get(key, (err, reply) => {
            if (err) {
                throw err;
            }

            return next(JSON.parse(reply));
        });
    }
};
