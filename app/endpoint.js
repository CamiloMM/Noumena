var autoincrement = require('autoincrement');
var useragent     = require('useragent');
var db            = require('./db.js');

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

// A unified way of handling URL arguments. Arguments are assumed to take
// the following form: 'project/category/action[/flags][/{data}][.ext]'
// where the first three items are mandatory, and any of flags/data/ext may or may
// not be specified. Note that, if present, {data} must be a valid JSON object.
// If the whole thing is invalid, null will be returned. Else, an object will
// be return with keys named after the elements mentioned above, where optional
// fields not specified will be null.
// An extra parameter, ext, may be specified, that serves to verify the extension
// found is allowed. It can be a string (literal match) or a regular expression.
// Note it does not include the leading dot. This verification will only be
// performed if the extension is found in the args.
// The flags field returned, if any, will be an object where each flag is a
// property which maps to "true"; so flags 'ab' become {a:true,b:true}. This
// allows for a simplified syntax such as if(flags){...if(flags.a){...}...}.
endpoint.parseArgs = function(args, ext) {
    // Sanity checks on the arguments.
    if (typeof args != 'string') return null;
    if (ext && !(typeof ext == 'string' || ext instanceof RegExp)) {
        throw new Error('ext argument must be a string or regular expression');
    }

    var pattern = /^([^\/]+)\/([^\/]+)\/([^\/]+)(\/([^{\/]*))?(\/(\{.*\}))?(\.(.+))?$/;
    var match = args.match(pattern);
    if (!match) return null;
    var parsed = {};

    // Set these three fields while guarding against whitespace.
    if (!(parsed.project  = match[1].trim())) return null;
    if (!(parsed.category = match[2].trim())) return null;
    if (!(parsed.action   = match[3].trim())) return null;

    // Parse flags into object keys.
    var flagString = match[5];
    if (typeof flagString == 'string') {
        var flags = {};
        for (var i = 0; i < flagString.length; i++) {
            flags[flagString[i]] = true;
        }
        parsed.flags = flags;
    } else {
        parsed.flags = null;
    }

    // A data argument is optional, but if present, it must be valid JSON.
    if (match[7]) {
        try {
            parsed.data = JSON.parse(match[7]);
        } catch (e) {
            return null;
        }
    } else {
        parsed.data = null;
    }

    // If an extension was found, and a verifier was specified, check it.
    if (match[9]) {
        if (ext) {
            if (typeof ext == 'string' && match[9] !== ext) return null;
            if (ext instanceof RegExp && !ext.test(match[9])) return null;
            parsed.ext = match[9];
        } else {
            parsed.ext = match[9];
        }
    } else {
        parsed.ext = null;
    }

    return parsed;
};

// Shared server-side flag parsing logic.
// Pass a flag object like the one created by .parseArgs, and an express request.
// The data object you pass may be null, and the returned data object may also be null.
endpoint.parseFlags = function(flags, req, data) {
    // Meta-flags.
    if (flags['-']) return data;
    var all = !!flags['*'];

    // Ensure we're writing on an object.
    data = data || {};

    // IP adress.
    if (all || flags.i) data.ip = req.ip;

    // Timestamp.
    if (all || flags.t) data.time = Math.round(Date.now() / 1000);

    // User-Agent.
    if (all || flags.a) data.agent = req.headers['user-agent'] || null;

    // Browser.
    var ua = null;
    if (all || flags.b) {
        ua = useragent.lookup(req.headers['user-agent']);
        data.browser = ua.family + ' ' + ua.major + '.' + ua.minor;
    }

    // Auto-incrementing number.
    if (all || flags.n) data.num = +autoincrement;

    // HTTP headers.
    if (all || flags.h) data.headers = req.headers;

    // Return null if data has no keys.
    return Object.keys(data).length ? data : null;
};

// Expose DB to endpoints. We may revisit this approach if it's too crude.
endpoint.db = db;

module.exports = endpoint;
