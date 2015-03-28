'use strict';

var joi = require('joi');

/* jshint -W106 */
var redisOptions = { retry_max_delay: 15000 };
/* jshint +W106 */

exports.register = function (plugin, options, next) {
    var validation = joi.validate(options, require('./schema'));
    if(validation.error) {
        return next(validation.error);
    }

    var redis = require('redis').createClient(options.port || 6379, options.host, redisOptions);

    var isCacheable = function(req) {
        if(!req.route.settings.tags) {
            return true;
        }

        return req.route.settings.tags.indexOf('non-cacheable') === -1;
    };

    var generateCacheKey = function(req) {
        return req.route.method + '|' + req.url.path.toLowerCase();
    };

    plugin.ext('onPreHandler', function(req, reply) {
        req.outputCache = req.outputCache || {
            isStale: true,
            data: null
        };

        //if(redis.connected) {
            redis.get(generateCacheKey(req), function(err, data) {
                if(err) {
                    return reply.continue();
                }

                if(data) {
                    var cachedValue = JSON.parse(data);
                    var currentTime = Math.floor(new Date() / 1000);
                    req.outputCache.data = cachedValue;

                    if(cachedValue.expiresOn > currentTime) {
                        req.outputCache.isStale = false;

                        req.route.settings.handler = function(__, cacheReply) {
                            var response  = cacheReply(cachedValue.payload);
                            response.code(cachedValue.statusCode);

                            var keys = Object.keys(cachedValue.headers);
                            for(var i = 0; i < keys.length; i++) {
                                var key = keys[i];
                                response.header(key, cachedValue.headers[key]);
                            }
                        };
                    }
                }

                return reply.continue();
            });
        //} else {
        //    return reply.continue();
        //}
    });

    plugin.ext('onPreResponse', function(req, reply) {
        if(isCacheable(req) === false) {
            return reply.continue();
        }

        if(req.outputCache.isStale && req.response.statusCode && redis.connected) {
            options.onCacheMiss();

            var cacheValue = {
                statusCode: req.response.statusCode,
                headers: req.response.headers,
                payload: req.response.source,
                expiresOn: Math.floor(new Date() / 1000) + options.ttl
            };

            redis.set(generateCacheKey(req), JSON.stringify(cacheValue));
        }

        reply.continue();
    });

    next();
};