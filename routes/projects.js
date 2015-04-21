var express = require('express');
var router  = express.Router();
var app     = require('../app.js');

router.get('/projects', app.adminOnly(function(req, res) {
    res.render('projects', { title: 'Projects' });
}));

module.exports = router;
