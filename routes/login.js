var express  = require('express');
var router   = express.Router();
var passport = require('../app/passport');

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});

router.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) return next(err);
        if (!user) {
            req.flash('bad', 'User or password incorrect. Try again.');
            return res.redirect('/login');
        }
        req.logIn(user, function(err) {
            if (err) { return next(err); }
            req.flash('good', 'Logged in as "' + user.name + '" successfully.');
            return res.redirect('/projects');
        });
    })(req, res, next);
});

// Technically a different route, but related, so we'll drop it here.
router.post('/logout', function(req, res) {
    req.logout();
    req.flash('good', 'I don\'t know you anymore - you\'ve logged out.');
    res.redirect('back');
});

module.exports = router;
