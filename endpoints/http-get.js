var endpoint = require('../app/endpoint');

// This endpoint defines an HTTP GET interface for adding events,
// and is limited to small data objects (if any).
// For large data objects you'd need the POST version.

// The name is "hg" for "http GET".
endpoint.register('http/GET/hg', function(req, res, args) {
    endpoint.parseArgs(args, null, req, 'http-get', function(err, parsed) {
        if (err) return res.sendStatus(500);
        if (!parsed) return res.sendStatus(400);
        endpoint.db.registerEvent(parsed, function(error) {
            res.sendStatus(error ? 500 : 200);
        });
    });
});
