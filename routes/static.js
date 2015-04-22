var express  = require('express');
var router   = express.Router();
var app      = require('../app.js');

var types = {css: 'text/css', js: 'application/javascript'};
var pattern = /^[a-f0-9]{32}\.(css|js)$/;

router.get('/static/:path(*)', function(req, res) {
    if (pattern.test(req.params.path)) {
        var md5 = req.params.path.substr(0, 32);
        var type = req.params.path.substr(33);
        var compiled = app.get(type);
        if (compiled.md5 === md5) {
            res.contentType(types[type]);
            res.set('Cache-Control', 'public, max-age=31536000'); // A year.
            res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
            res.send(compiled.code);
            return;
        }
    }

    res.status(404).send('Not found!');
});

module.exports = router;
