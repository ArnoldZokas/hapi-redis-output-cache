'use strict';

let _ = require('underscore');

let lowerCase = (array) => {
    let result = [];

    for (let i = 0; i < array.length; i++) {
        result.push(array[i].toLowerCase());
    }

    return result;
};

let getHeaders = (rawRequestHeaders, varyByHeaders) => {
    let requestHeaders = _.map(_.keys(rawRequestHeaders), (requestHeaderKey) => {
        return {
            key: requestHeaderKey.toLowerCase(),
            value: rawRequestHeaders[requestHeaderKey]
        }
    });

    let varyByHeaderKeys = _.sortBy(lowerCase(varyByHeaders));

    let filteredHeaders = _.compact(_.map(varyByHeaderKeys, (varyByHeaderKey) => {
        let requestHeader = _.find(requestHeaders, (requestHeader) => { return requestHeader.key === varyByHeaderKey; });
        return requestHeader ? `${requestHeader.key}=${requestHeader.value}` : null;
    }));

    return filteredHeaders.join('|');
};

module.exports = {
  generateCacheKey: (req, options) => {
      let partition = options.partition || 'default';
      let method    = req.route.method.toLowerCase();
      let path      = req.url.path.toLowerCase();
      let headers   = getHeaders(req.headers, options.varyByHeaders);

      return _.compact([partition, method, path, headers]).join('|');
  }
};