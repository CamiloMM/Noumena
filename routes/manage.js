var express = require('express');
var router  = express.Router();
var app     = require('../app.js');
var db      = require('../app/db.js');

router.get('/manage/:project', app.adminOnly(function(req, res) {
    db.getCategories(req.params.project, function(categories) {
        if (!categories) req.flash('bad', 'Invalid project!');
        res.render('manage', {
            title: '/' + req.params.project,
            mode: categories ? 'categories' : 'error',
            project: req.params.project,
            categories: categories
        });
    });
}));

module.exports = router;
