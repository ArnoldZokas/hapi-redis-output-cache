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
    redis.on('error', options.onError || function() {});

    var isCacheable = function(req) {
        if(req.route.method !== 'get') {
            return false;
        }

        if(!req.route.settings.tags) {
            return true;
        }

        return req.route.settings.tags.indexOf('non-cacheable') === -1;
    };

    var getWhitelistedHeaders = function(requestHeaders, whitelist) {
        if((whitelist || []).length === 0) {
            return [];
        }

        var result = [];
        Object.keys(requestHeaders).forEach(function(header) {
            header = header.toLowerCase();

            if(whitelist.indexOf(header) > -1) {
                result.push(header + '=' + requestHeaders[header]);
            }
        });

        return result;
    };

    var generateCacheKey = function(req) {
        var method  = req.route.method,
            path    = req.url.path.toLowerCase(),
            headers = getWhitelistedHeaders(req.headers, options.varyByHeaders).join('&');

        console.log(headers);

        return method + '|' + path + '|' + headers;
    };

    plugin.ext('onPreHandler', function(req, reply) {
        req.outputCache = req.outputCache || {
            isStale: true,
            data: null
        };

        if(redis.connected === false) {
            return reply.continue();
        }

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
    });

    plugin.ext('onPreResponse', function(req, reply) {
        if(redis.connected === false) {
            return reply.continue();
        }

        if(isCacheable(req) === false) {
            return reply.continue();
        }

        if(req.outputCache && req.outputCache.isStale && req.response.statusCode) {
            options.onCacheMiss();

            var cacheValue = {
                statusCode: req.response.statusCode,
                headers: req.response.headers,
                payload: req.response.source,
                expiresOn: Math.floor(new Date() / 1000) + options.staleIn
            };

            redis.setex(generateCacheKey(req), options.expiresIn, JSON.stringify(cacheValue));
        }

        reply.continue();
    });

    next();
};