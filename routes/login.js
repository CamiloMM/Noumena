var express  = require('express');
var router   = express.Router();
var passport = require('../app/passport');

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/projects',
    failureRedirect: '/login',
    failureFlash:    false
}));

// Technically a different route, but related, so we'll drop it here.
router.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
});

module.exports = router;
