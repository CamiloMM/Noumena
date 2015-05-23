var endpoint = require('../app/endpoint');

// This endpoint defines an HTTP GET interface for adding events,
// and is limited to small data objects (if any).
// For large data objects you'd need the POST version.

// The name is "hg" for "http GET".
endpoint.register('http/GET/hg', function(req, res, args) {
    args = endpoint.parseArgs(args);
    if (!args) return res.sendStatus(400);
    var project = args.project, category = args.category, action = args.action;
    function callback(error) {
        if (error) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    }
    if (args.data) {
        endpoint.db.registerDataEvent(project, category, action, args.data, callback);
    } else {
        endpoint.db.registerSimpleEvent(project, category, action, callback);
    }
});
