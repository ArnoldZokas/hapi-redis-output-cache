'use strict';

const cacheKeyGenerator = require('../src/cacheKeyGenerator');
const redis             = require('redis').createClient(1234, '127.0.0.1');

module.exports = {
    reset: seedValue => {
        redis.flushdb();

        if(seedValue) {
            redis.set(seedValue.key, JSON.stringify(seedValue.value));

            if(seedValue.ttl) {
                redis.expire(seedValue.key, seedValue.ttl);
            }
        }
    },
    ttl: (req, next) => {
        var key = cacheKeyGenerator.generateCacheKey(req, { partition: 'test' });;

        redis.ttl(key, (err, reply) => {
            if (err) {
                throw err;
            }

            return next(reply);
        });
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
