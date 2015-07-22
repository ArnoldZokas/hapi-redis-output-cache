'use strict';

var joi = require('joi');
var hoek = require('hoek');

/* jshint -W106 */
var redisOptions = { retry_max_delay: 15000 };
/* jshint +W106 */

exports.register = function (plugin, options, next) {
    var validation = joi.validate(options, require('./schema'));
    if(validation.error) {
        return next(validation.error);
    }

    var routeDefaults = {
      varyByHeaders: options.varyByHeaders,
      staleIn: options.staleIn,
      expiresIn: options.expiresIn,
      partition: options.partition
    };

    var redis = require('redis').createClient(options.port || 6379, options.host, redisOptions);
    redis.on('error', options.onError || function() {});

    var isCacheable = function(req) {
        if(req.route.method !== 'get') {
            return false;
        }

        var pluginSettings = req.route.settings.plugins['hapi-redis-output-cache'];

        return pluginSettings ? pluginSettings.cacheable : false;
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

    var generateCacheKey = function(req, routeSettings) {
        var method  = req.route.method,
            path    = req.url.path.toLowerCase(),
            headers = getWhitelistedHeaders(req.headers, routeSettings.varyByHeaders).join('&');

        return [routeSettings.partition, method, path, headers].join('|');
    };

    plugin.ext('onPreHandler', function(req, reply) {
        req.outputCache = req.outputCache || {
            isStale: true,
            data: null
        };

        if(isCacheable(req) === false) {
            return reply.continue();
        }

        if(redis.connected === false) {
            return reply.continue();
        }

        var routeSettings = hoek.applyToDefaults(routeDefaults, req.route.settings.plugins['hapi-redis-output-cache']);
        var cacheKey = generateCacheKey(req, routeSettings);

        redis.get(cacheKey, function(err, data) {
            if(err) {
                return reply.continue();
            }

            if(data) {
                var cachedValue = JSON.parse(data);
                var currentTime = Math.floor(new Date() / 1000);
                req.outputCache.data = cachedValue;

                if(cachedValue.expiresOn > currentTime) {
                    req.outputCache.isStale = false;

                    var response  = reply(cachedValue.payload);
                    response.code(cachedValue.statusCode);

                    var keys = Object.keys(cachedValue.headers);
                    for(var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        response.header(key, cachedValue.headers[key]);
                    }

                    return;
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

        if(Math.floor(req.response.statusCode / 100) === 5) {
            return reply.continue();
        }

        if(req.outputCache && req.outputCache.isStale && req.response.statusCode) {
            options.onCacheMiss(req);

            var routeSettings = hoek.applyToDefaults(routeDefaults, req.route.settings.plugins['hapi-redis-output-cache']);

            var cacheValue = {
                statusCode: req.response.statusCode,
                headers: req.response.headers,
                payload: req.response.source,
                expiresOn: Math.floor(new Date() / 1000) + routeSettings.staleIn
            };

            var cacheKey = generateCacheKey(req, routeSettings);
            redis.setex(cacheKey, routeSettings.expiresIn, JSON.stringify(cacheValue));
        }

        reply.continue();
    });

    next();
};
