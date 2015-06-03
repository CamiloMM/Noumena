var endpoint = require('../app/endpoint');

// This endpoint defines an HTTP POST interface for adding events,
// which supports URL-embedded data and flags, but appends to that data
// (including event-generated data) any data passed via POST.
// Data can be passed via POST in two ways: either via HTML-form-like
// properties (<input name="myField" .../>) or directly as JSON, such as:
// curl -H "Content-Type: application/json" -X POST -d '{"myField":123}'
// Note that empty JSON or even empty POST request bodies are still accepted,
// but treated like a simple event (unless flags/url data is passed, of course).

// The name is "hp" for "http POST".
endpoint.register('http/POST/hp', function(req, res, args) {
    endpoint.parseArgs(args, null, req, 'http-post', function(err, parsed) {
        if (err) return res.sendStatus(500);
        if (!parsed) return res.sendStatus(400);
        // Should not be an array (or undefined, if that's possible).
        if (!req.body || req.body.constructor !== Array) return res.sendStatus(400);
        // Only write POST data if there's any to write.
        for (var i in req.body) {
            parsed.data = parsed.data || {};
            parsed.data[i] = req.body[i];
        }
        endpoint.db.registerEvent(parsed, function(error) {
            res.sendStatus(error ? 500 : 200);
        });
    });
});
