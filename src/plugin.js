'use strict';

const joi                = require('joi');
const cacheKeyGenerator  = require('./cacheKeyGenerator');

exports.register = function (plugin, options, next) {
    const validation = joi.validate(options, require('./schema'));

    if(validation.error) {
        return next(validation.error);
    }

    const client = require('redis').createClient({
        host: options.host,
        port: options.port || 6379
    });

    // // TODO: test error behaviour
    // client.on('error', options.onError || function() { server.log? });

    plugin.ext('onPreHandler', (req, reply) => {
        const routeOptions = req.route.settings.plugins['hapi-redis-output-cache'] || {};
        if(routeOptions.isCacheable !== true) {
            return reply.continue();
        }

        if(req.route.method !== 'get') {
            return reply.continue();
        }

        const cacheKey = cacheKeyGenerator.generateCacheKey(req, options);

        // if(client.connected === false) {
        //     return reply.continue();
        // }
        client.get(cacheKey, (err, data) => {
            if(err) {
                return reply.continue();
            }

            if(data) {
                const cachedValue = JSON.parse(data);
                req.outputCache = {
                    data: cachedValue,
                    isStale: true,
                    originalHandler: req.route.settings.handler
                };

                const currentTime = Math.floor(new Date() / 1000);

                if(cachedValue.expiresOn > currentTime) {
                    req.outputCache.isStale = false;

                    req.route.settings.handler = function(req, reply) {
                        const response  = reply(cachedValue.payload);
                        response.code(cachedValue.statusCode);

                        const keys = Object.keys(cachedValue.headers);
                        for(let i = 0; i < keys.length; i++) {
                            const key = keys[i];
                            response.header(key, cachedValue.headers[key]);
                        }
                    };
                }
            }

            return reply.continue();
        });
    });

    plugin.ext('onPreResponse', (req, reply) => {
        const routeOptions = req.route.settings.plugins['hapi-redis-output-cache'] || {};
        if(routeOptions.isCacheable !== true) {
            return reply.continue();
        }

        if(req.route.method !== 'get') {
            return reply.continue();
        }

        if(req.response.statusCode !== 200) {
            if (req.response.statusCode >= 500 && req.response.statusCode < 600 && req.outputCache && req.outputCache.data) {
                req.response.statusCode = req.outputCache.data.statusCode;
                req.response.headers['content-type'] = 'application/json; charset=utf-8';

                const keys = Object.keys(req.outputCache.data.headers);
                for(let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    req.response.headers[key] = req.outputCache.data.headers[key];
                }

                req.response.source = req.outputCache.data.payload;
            }

            return reply.continue();
        }

        if(req.outputCache && req.outputCache.isStale === false) {
            req.route.settings.handler = req.outputCache.originalHandler;
            return reply.continue();
        }

        const cacheKey = cacheKeyGenerator.generateCacheKey(req, options);

        const cacheValue = {
            statusCode: req.response.statusCode,
            headers: req.response.headers,
            payload: req.response.source,
            expiresOn: Math.floor(new Date() / 1000) + options.staleIn
        };

        // if(client.connected === false) {
        //     return reply.continue();
        // }
        client.setex(cacheKey, options.expiresIn, JSON.stringify(cacheValue));

        options.onCacheMiss(req, reply);

        return reply.continue();
    });

    next();
};
