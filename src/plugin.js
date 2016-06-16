'use strict';

var joi  = require('joi');
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
    //
    // var defaultCacheOptions = {
    //   varyByHeaders: options.varyByHeaders,
    //   staleIn: options.staleIn,
    //   expiresIn: options.expiresIn,
    //   partition: options.partition
    // };
    //
    // var redisOptions = {
    //   host: options.host,
    //   port: options.port || 6379,
    //   retry_strategy: function (retry_options) {
    //     // TODO: test retry behaviour
    //     return Math.max(retry_options.attempt * 100, 15000);
    //   }
    // };
    //
    // var client = require('redis').createClient(redisOptions);
    //
    // // TODO: test error behaviour
    // client.on('error', options.onError || function() {});
    //
    // plugin.ext('onPreHandler', function(req, reply) {
    //     req.outputCache = req.outputCache || {
    //         isStale: null,
    //         data: null
    //     };
    //
    //     if(isisCacheable(req) === false) {
    //         return reply.continue();
    //     }
    //
    //     if(client.connected === false) {
    //         return reply.continue();
    //     }
    //
    //     // TODO: test to ensure route-specific options are respected
    //     var routeSettings = hoek.applyToDefaults(defaultCacheOptions, req.route.settings.plugins['hapi-redis-output-cache']);
    //     var cacheKey = generateCacheKey(req, routeSettings);
    //
    //     client.get(cacheKey, function(err, data) {
    //         if(err) {
    //             return reply.continue();
    //         }
    //
    //         if(data) {
    //             var cachedValue = JSON.parse(data);
    //             var currentTime = Math.floor(new Date() / 1000);
    //             req.outputCache.data = cachedValue;
    //
    //             if(cachedValue.expiresOn > currentTime) {
    //                 req.outputCache.isStale = false;
    //
    //                 var response  = reply(cachedValue.payload);
    //                 response.code(cachedValue.statusCode);
    //
    //                 var keys = Object.keys(cachedValue.headers);
    //                 for(var i = 0; i < keys.length; i++) {
    //                     var key = keys[i];
    //                     response.header(key, cachedValue.headers[key]);
    //                 }
    //
    //                 return;
    //             }
    //         }
    //
    //         return reply.continue();
    //     });
    // });
    //
    // plugin.ext('onPreResponse', function(req, reply) {
    //     if(client.connected === false) {
    //         return reply.continue();
    //     }
    //
    //     if(isisCacheable(req) === false) {
    //         return reply.continue();
    //     }
    //
    //     if(Math.floor(req.response.statusCode / 100) === 5) {
    //         return reply.continue();
    //     }
    //
    //     if(req.outputCache && req.outputCache.isStale && req.response.statusCode) {
    //         options.onCacheMiss(req);
    //
    //         var routeSettings = hoek.applyToDefaults(defaultCacheOptions, req.route.settings.plugins['hapi-redis-output-cache']);
    //
    //         var cacheValue = {
    //             statusCode: req.response.statusCode,
    //             headers: req.response.headers,
    //             payload: req.response.source,
    //             expiresOn: Math.floor(new Date() / 1000) + routeSettings.staleIn
    //         };
    //
    //         var cacheKey = generateCacheKey(req, routeSettings);
    //         client.setex(cacheKey, routeSettings.expiresIn, JSON.stringify(cacheValue));
    //     }
    //
    //     reply.continue();
    // });

    next();
};
