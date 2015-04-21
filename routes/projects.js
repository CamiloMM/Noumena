var express = require('express');
var router  = express.Router();

router.get('/projects', function(req, res) {
    req.adminOnly(function() {
        res.render('projects', { title: 'Projects' });
    });
});

module.exports = router;
