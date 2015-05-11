var express = require('express');
var router  = express.Router();
var app     = require('../app.js');
var db      = require('../app/db.js');

router.get('/projects', app.adminOnly(function(req, res) {
    db.getProjects(function(projects) {
        res.render('projects', { title: 'Projects', projects: projects });
    });
}));

module.exports = router;
