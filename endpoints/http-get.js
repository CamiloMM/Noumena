var endpoint = require('../app/endpoint');

// This endpoint defines an HTTP GET interface for adding events,
// and is limited to small data objects (if any).
// For large data objects you'd need the POST version.

// The name is "hg" for "http GET".
endpoint.register('http/GET/hg', function(req, res, args) {
    endpoint.parseArgs(args, null, req, 'http-get', function(err, parsed) {
        if (err) return res.sendStatus(500);
        if (!parsed) return res.sendStatus(400);
        var project  = parsed.project,
            category = parsed.category,
            action   = parsed.action;
        function callback(error) { res.sendStatus(error ? 500 : 200); }
        if (parsed.data) {
            endpoint.db.registerDataEvent(project, category, action, parsed.data, callback);
        } else {
            endpoint.db.registerSimpleEvent(project, category, action, callback);
        }
    });
});
