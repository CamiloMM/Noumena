var express = require('express');
var router  = express.Router();
var app     = require('../app.js');
var db      = require('../app/db.js');

router.get('/manage', app.adminOnly(function(req, res) {
    db.getProjects(function(projects) {
        if (!projects) req.flash('bad', 'Database error from db.getProjects!');
        res.render('manage', {
            title: '/',
            mode: projects ? 'projects' : 'error',
            projects: projects
        });
    });
}));

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

router.get('/manage/:project/:category', app.adminOnly(function(req, res) {
    db.getActions(req.params.project, req.params.category, function(actions) {
        if (!actions) req.flash('bad', 'Invalid project/category!');
        res.render('manage', {
            title: '/' + req.params.project + '/' + req.params.category,
            mode: actions ? 'actions' : 'error',
            project: req.params.project,
            category: req.params.category,
            actions: actions
        });
    });
}));

module.exports = router;
