'use strict';

var joi  = require('joi');
var cacheKeyGenerator  = require('./cacheKeyGenerator');
//var hoek = require('hoek');

// var isisCacheable = function(req) {
//   // TODO: ensure non-get requests are not cached
//     if(req.route.method !== 'get') {
//         return false;
//     }
//
//     return req.route.settings.plugins['hapi-redis-output-cache'].isCacheable;
// };

exports.register = function (plugin, options, next) {
    var validation = joi.validate(options, require('./schema'));

    if(validation.error) {
        return next(validation.error);
    }

    // var defaultCacheOptions = {
    //   varyByHeaders: options.varyByHeaders,
    //   staleIn: options.staleIn,
    //   expiresIn: options.expiresIn,
    //   partition: options.partition
    // };
    //

    var client = require('redis').createClient({
        host: options.host,
        port: options.port || 6379
    });

    // // TODO: test error behaviour
    // client.on('error', options.onError || function() {});
    //
    plugin.ext('onPreHandler', function(req, reply) {
        // req.outputCache = req.outputCache || {
        //     isStale: null,
        //     data: null
        // };
        //
        // if(isisCacheable(req) === false) {
        //     return reply.continue();
        // }
        //
        // if(client.connected === false) {
        //     return reply.continue();
        // }
        //
        // // TODO: test to ensure route-specific options are respected
        // var routeSettings = hoek.applyToDefaults(defaultCacheOptions, req.route.settings.plugins['hapi-redis-output-cache']);
        // var cacheKey = generateCacheKey(req, routeSettings);
        //
        // client.get(cacheKey, function(err, data) {
        //     if(err) {
        //         return reply.continue();
        //     }
        //
        //     if(data) {
        //         var cachedValue = JSON.parse(data);
        //         var currentTime = Math.floor(new Date() / 1000);
        //         req.outputCache.data = cachedValue;
        //
        //         if(cachedValue.expiresOn > currentTime) {
        //             req.outputCache.isStale = false;
        //
        //             var response  = reply(cachedValue.payload);
        //             response.code(cachedValue.statusCode);
        //
        //             var keys = Object.keys(cachedValue.headers);
        //             for(var i = 0; i < keys.length; i++) {
        //                 var key = keys[i];
        //                 response.header(key, cachedValue.headers[key]);
        //             }
        //
        //             return;
        //         }
        //     }
        //
        //     return reply.continue();
        // });

        var routeOptions = req.route.settings.plugins['hapi-redis-output-cache'] || {};
        if(routeOptions.isCacheable !== true) {
            return reply.continue();
        }

        if(req.route.method !== 'get') {
            return reply.continue();
        }

        var cacheKey = cacheKeyGenerator.generateCacheKey(req, options);

        client.get(cacheKey, (err, data) => {
            if(err) {
                return reply.continue();
            }

            if(data) {
                var cachedValue = JSON.parse(data);
                req.outputCache = {
                    data: cachedValue,
                    originalHandler: req.route.settings.handler
                };

                req.route.settings.handler = function(req, reply) {
                    var response  = reply(cachedValue.payload);
                    response.code(cachedValue.statusCode);

                    var keys = Object.keys(cachedValue.headers);
                    for(var i = 0; i < keys.length; i++) {
                        var key = keys[i];
                        response.header(key, cachedValue.headers[key]);
                    }
                };
            }

            return reply.continue();
        });
    });

    plugin.ext('onPreResponse', function(req, reply) {
        // if(client.connected === false) {
        //     return reply.continue();
        // }
        //
        // if(req.outputCache && req.outputCache.isStale && req.response.statusCode) {
        //     client.setex(cacheKey, routeSettings.expiresIn, JSON.stringify(cacheValue));
        // }

        var routeOptions = req.route.settings.plugins['hapi-redis-output-cache'] || {};
        if(routeOptions.isCacheable !== true) {
            return reply.continue();
        }

        if(req.route.method !== 'get') {
            return reply.continue();
        }

        if(req.response.statusCode !== 200) {
            return reply.continue();
        }

        if(req.outputCache) {
            req.route.settings.handler = req.outputCache.originalHandler;
            return reply.continue();
        }

        options.onCacheMiss(req, reply);

        var cacheKey = cacheKeyGenerator.generateCacheKey(req, options);

        var cacheValue = {
            statusCode: req.response.statusCode,
            headers: req.response.headers,
            payload: req.response.source,
            expiresOn: Math.floor(new Date() / 1000) + options.staleIn
        };

        client.setex(cacheKey, options.expiresIn, JSON.stringify(cacheValue));

        return reply.continue();
    });

    next();
};
