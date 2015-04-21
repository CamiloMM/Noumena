var express = require('express');
var router  = express.Router();

router.get('/projects', function(req, res) {
    if (req.user && req.user.admin) {
        res.render('projects', { title: 'Projects' });
    } else {
        req.flash('bad', 'You must be logged in as an admin to view that page.');
        res.redirect('/login');
    }
});

module.exports = router;
