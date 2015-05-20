var express  = require('express');
var router   = express.Router();
var endpoint = require('../app/endpoint');

router.get('/event/:name/:args(*)', function(req, res) {
    var e = endpoint('http', 'get', req.params.name);
    e({
        args: req.params.args,
        body: req.body
    });
});

module.exports = router;
