var passport      = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config        = require('../config.json');

passport.use(new LocalStrategy(function(username, password, done) {
    var user = config.users[username];

    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }

    if (user.pass !== password) {
        return done(null, false, { message: 'Incorrect password.' });
    }

    user.name = username;

    done(null, user);
}));

// We're using very dumb serialization here because we don't really
// intend on having many users at the moment (probably just admin).

passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
});

passport.deserializeUser(function(json, done) {
    done(null, JSON.parse(json));
});

module.exports = passport;
