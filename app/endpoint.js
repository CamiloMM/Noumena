var db = require('./db.js');

// Endpoint API.
// This file defines methods that can be called from ./endpoints in order to expose
// their logic. All ./endpoints should include this file and *only* this file.

// Actual endpoints are stored in this object.
var endpoints = {};

// Endpoints are built from this constructor.
function Endpoint(routine) {
    if (typeof routine != 'function') throw new Error('routine must be a function');
    // The req and res are from express, and args is the substring from the URL
    // that can contain whatever arguments the event may take.
    return function(req, res, args) {
        // I'm just shielding the underlying routine here because I don't
        // know if I'll make changes to this API yet.
        routine(req, res, args);
    };
}

// Calling endpoint as a function will return an endpoint instance or null.
function endpoint(protocol, method, name) {
    // Accept first argument to be 'protocol/method/name'.
    if (!name) {
        name = protocol.split('/')[2];
        method = protocol.split('/')[1];
        protocol = protocol.split('/')[0];
    }

    // Normalize method to uppercase.
    method = method.toUpperCase();

    try {
        // This will throw if it doesn't exist.
        endpoints[protocol][method][name].mustExist;
        return endpoints[protocol][method][name];
    } catch (e) {
        return null;
    }
};

// Registers an endpoint with a given name, for a specific method of a protocol.
// An endpoint may not be registered twice; unless options.[ignore|override] are true.
// None of the first three arguments may contain a "/".
// The first three arguments can be collapsed as a string: 'protocol/method/name'
endpoint.register = function(protocol, method, name, endpoint, options) {
    // Accept first argument to be 'protocol/method/name'.
    if (!endpoint) {
        options = name;
        endpoint = method;
        name = protocol.split('/')[2];
        method = protocol.split('/')[1];
        protocol = protocol.split('/')[0];
    }

    // Normalize method to uppercase.
    method = method.toUpperCase();

    // Options are optional.
    options = options || {};

    // Build namespace if it doesn't exist already.
    if (!endpoints[protocol]) endpoints[protocol] = {};
    if (!endpoints[protocol][method]) endpoints[protocol][method] = {};

    if (!endpoints[protocol][method][name]) {
        endpoints[protocol][method][name] = new Endpoint(endpoint);
    } else {
        // In this case we'll either throw, ignore or override the endpoint.
        switch (true) {
            // Keep the existing endpoint.
            case !!options.ignore:
                break;
            // Write the given endpoint over the existing one.
            case !!options.override:
                endpoints[protocol][method][name] = new Endpoint(endpoint);
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

// Expose DB to endpoints. We may revisit this approach if it's too crude.
endpoint.db = db;

module.exports = endpoint;
