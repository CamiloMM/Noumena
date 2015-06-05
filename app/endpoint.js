var autoincrement = require('autoincrement');
var useragent     = require('useragent');
var db            = require('./db.js');
var geoip         = require('./geoip.js');
var objectHash    = require('object-hash');

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

// (This comment block is long, but this is a crucial part of the codebase.)
// A unified way of handling URL arguments. The args value (from an URL) is assumed
// to take the following form: 'project/category/action[/flags][/{data}][.ext]'
// where the first three items are mandatory, and any of flags/data/ext may or may
// not be specified. Note that, if present, {data} must be a valid JSON object.
// The ext parameter, if not null, serves to validate if any extension found
// is allowed. It can be a string (literal match) or a regular expression.
// Note it does not include the leading dot. This verification will only be
// performed if the extension is found in the args. Extensions may have more
// than one dot (e.g., 'tar.gz') and are returned lowercased for convenience.
// If you wish for automated flag parsing, pass req (ExpressJS request object) and
// endpoint (the endpoint's name). Either way, you can add your own flag parsing.
// Hook your logic at callback(err, parsed) where err indicates a problem, and
// a parsed value of null indicates args non-conformity. If args was valid, parsed
// will be an object with keys named after the elements mentioned above (project,
// category, action, flags, data and ext) where flags, data and ext may be null.
// The flags field will either be null or an object where each found flag
// is a property which maps to "true"; so flags 'ab' become {a:true,b:true}.
// This allows for a simplified syntax such as if(flags){...if(flags.a){...}...}.
// Note: if you want an endpoint to provide dynamic responses and extra logic,
// three approaches can be taken: using project/category/action as a "key",
// using ext as a key (e.g., .123456.ext), or coding a custom parseArgs
// implementation. The latter is the hardest and least preferrable.
endpoint.parseArgs = function(args, ext, req, endpoint, callback) {
    // Sanity checks on the arguments.
    if (typeof args != 'string') return callback(new Error('args must be a string'));
    if (ext && !(typeof ext == 'string' || ext instanceof RegExp)) {
        return callback(new Error('ext must be a string or regular expression'));
    }

    var pattern = /^([^\/]+)\/([^\/]+)\/([^\/]+)(\/([^{\/.]*))?(\/(\{.*\}))?(\.(.+))?$/;
    var match = args.match(pattern);
    if (!match) return callback(null, null);
    var parsed = {};

    // Set these three fields while guarding against whitespace.
    if (!(parsed.project  = match[1].trim())) return callback(null, null);
    if (!(parsed.category = match[2].trim())) return callback(null, null);
    if (!(parsed.action   = match[3].trim())) return callback(null, null);

    // A data argument is optional, but if present, it must be valid JSON.
    if (match[7]) {
        try {
            parsed.data = JSON.parse(match[7]);
        } catch (e) {
            return callback(null, null);
        }
    } else {
        parsed.data = null;
    }

    // If an extension was found, and a verifier was specified, check it.
    if (match[9]) {
        if (ext) {
            if (typeof ext == 'string' && match[9] !== ext) return callback(null, null);
            if (ext instanceof RegExp && !ext.test(match[9])) return callback(null, null);
            parsed.ext = match[9].toLowerCase();
        } else {
            parsed.ext = match[9].toLowerCase();
        }
    } else {
        parsed.ext = null;
    }

    // Parse flags into object keys as last step, since it may be async.
    var flagString = match[5];
    if (typeof flagString == 'string') {
        var flags = {};
        for (var i = 0; i < flagString.length; i++) {
            flags[flagString[i]] = true;
        }
        parsed.flags = flags;
        // If req and endpoint have been passed, parse the flags.
        if (req && endpoint) {
            return parseFlags(flags, req, parsed.data, endpoint, function(err, data) {
                if (err) return callback(err);
                if (data) parsed.data = data;
                return callback(null, parsed);
            });
        } else {
            return callback(null, parsed);
        }
    } else {
        parsed.flags = null;
        return callback(null, parsed);
    }
};

// Shared server-side flag parsing logic.
// Pass a flags object like the one created by .parseArgs, and an express request.
// The data object you pass may be null, and the resulting data object may also be null.
// Also pass the endpoint name, and a standard callback(err, data) to get the data.
var parseFlags = endpoint.parseFlags = function(flags, req, data, endpoint, callback) {
    // Meta-flags.
    if (flags['-']) return callback(null, data);
    var all = !!flags['*'];

    // Ensure we're writing on an object.
    data = data || {};

    // IP adress.
    if (all || flags.i) data.ip = req.ip;

    // Timestamp.
    if (all || flags.t) data.time = Math.round(Date.now() / 1000);

    // User-Agent.
    if (all || flags.a) data.agent = req.headers['user-agent'] || null;

    // Parse user-agent only once, if needed at all.
    if (all || flags.b || flags.o || flags.p || flags.f)
        var ua = useragent.lookup(req.headers['user-agent']);

    // Browser, OS and device.
    if (all || flags.b)
        data.browser = ua.toAgent().replace(/(\d+\.\d+)\.\d+$/, '$1'); // Remove patch #.
    if (all || flags.o) data.os = ua.os.toString();
    if (all || flags.d) data.device = ua.device.toString();

    // Fingerprint.
    if (all || flags.f) {
        // The fingerprint is a 32-bit int taken from
        // the first 4 bytes of an md5 of a set of data.
        data.fingerprint = parseInt(objectHash.MD5({
            browser : ua.family,
            os      : ua.os.toString(),
            device  : ua.device.toString(),
            ip      : req.ip,
            langs   : req.get('accept-language'),
            session : req.cookies['noumena-session']
        }).substr(0, 8), 16);
    }

    // Auto-incrementing number.
    if (all || flags.n) data.num = +autoincrement;

    // HTTP headers.
    if (all || flags.h) data.headers = req.headers;

    // Endpoint name.
    if (all || flags.e) data.endpoint = endpoint || 'Unknown Endpoint';

    // If we need to perform GeoIP, this is async.
    if (all || flags.g) {
        geoip.locate(req.ip, function(err, geo) {
            if (err) return callback(err);
            data.geo = [geo.lon, geo.lat];
            data.country = geo.country;
            callback(null, data);
        });
    } else {
        // Pass null if data has no keys.
        data = Object.keys(data).length ? data : null;
        callback(null, data);
    }
};

// Expose DB to endpoints. We may revisit this approach if it's too crude.
endpoint.db = db;

module.exports = endpoint;
