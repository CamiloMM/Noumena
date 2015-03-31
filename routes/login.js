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

module.exports = router;
