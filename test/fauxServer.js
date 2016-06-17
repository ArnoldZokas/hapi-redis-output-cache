'use strict';

const hapi = require('hapi');
let fauxEndpoints;

module.exports = next => {
    const server = new hapi.Server();
    server.connection({ port: 3000 });

    server.route({
        method: "GET",
        path: "/cacheable-successful-request/{id}",
        config: {
            handler: (req, reply) => {
                reply({ id: req.params.id, test: true }).header('Content-Language', 'de-DE');
            },
            plugins: {
                'hapi-redis-output-cache': { isCacheable: true }
            }
        }
    });

    server.route({
        method: "POST",
        path: "/cacheable-successful-request",
        config: {
            handler: (req, reply) => {
                reply({ test: true }).header('Content-Language', 'de-DE').code(200);
            },
            plugins: {
                'hapi-redis-output-cache': { isCacheable: true }
            }
        }
    });

    server.route({
        method: "GET",
        path: "/non-cacheable-successful-request",
        config: {
            handler: (req, reply) => {
                reply({ test: true }).header('Content-Language', 'de-DE');
            }
        }
    });

    server.route({
        method: "GET",
        path: "/cacheable-failed-request",
        config: {
            handler: (req, reply) => {
                reply().code(404);
            },
            plugins: {
                'hapi-redis-output-cache': { isCacheable: true }
            }
        }
    });

    server.register([
        {
            register: require('../index'),
            options: {
                partition: 'test',
                host: '127.0.0.1',
                port: 1234,
                staleIn: 30,
                expiresIn: 60,
                onCacheMiss: function(req, reply) { req.context = { cacheMiss: true } }
            }
        }
    ],
    err => {
        if (err) {
            throw err;
        }

        fauxEndpoints = {
            request: (options, next) => {
                server.inject({
                    method: options.method || 'GET',
                    url: options.url,
                    headers: options.headers
                }, response => {
                    next(response);
                });
            }
        };

        return next(fauxEndpoints);
    });
};
