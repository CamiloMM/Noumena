var db = require('./db.js');

// Endpoint API.
// This file defines methods that can be called from ./endpoints in order to expose
// their logic. All ./endpoints should include this file and *only* this file.

// Expose DB to endpoints. We may revisit this approach if it's too crude.
exports.db = db;

// Actual endpoints are stored in this object.
var endpoints = {};

// Registers an endpoint with a given name, for a specific method of a protocol.
// An endpoint may not be registered twice; unless options.[ignore|override] are true.
// None of the first three arguments may contain a "/".
exports.register = function(protocol, method, name, endpoint, options) {
    options = options || {}; // Options are optional.

    // Build namespace if it doesn't exist already.
    if (!endpoints[protocol]) endpoints[protocol] = {};
    if (!endpoints[protocol][method]) endpoints[protocol][method] = {};

    if (!endpoints[protocol][method][name]) {
        endpoints[protocol][method][name] = endpoint;
    } else {
        // In this case we'll either throw, ignore or override the endpoint.
        switch (true) {
            // Keep the existing endpoint.
            case !!options.ignore:
                break;
            // Write the given endpoint over the existing one.
            case !!options.override:
                endpoints[protocol][method][name] = endpoint;
                break;
            // Make a scandal about it.
            default:
                var namespace = [protocol, method, name].join('/');
                var msg = 'An endpoint already exists at "' + namespace + '".\n'
                        + 'Use options.ignore or options.override if not a mistake.';
                throw new Error(msg);
        }
    }
};
