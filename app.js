var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
var bodyParser    = require('body-parser');
var ObjectId      = require('mongodb').ObjectID;
var mongoose      = require('mongoose');
var session       = require('express-session');
var MongoStore    = require('connect-mongo')(session);
var requireDir    = require('require-dir');
var flash         = require('flash');
var compression   = require('compression');
var autoincrement = require('autoincrement');

// Export the app instance too, for referencing in other files.
var app = module.exports = express();

// Load the configuration JSON.
var config = require('./config.json');

// This will be a hash of type:instance, to log shit happening. 
app.set('errors', {});

// Connect to DB and start the app when connection is established.
// We don't need fancy error logging here because app will die if this fails.
mongoose.connect(config.dbUrl, {user: config.dbUser, pass: config.dbPass});
app.db = mongoose.connection;
app.db.on('error', console.error.bind(console, 'connection error:'));
app.db.once('open', function callback () {

    // Models and endpoints just need to be required.
    requireDir('./models');
    requireDir('./endpoints')

    // This is a passport instance configured in a separate file.
    var passport = require('./app/passport');

    // Settings for express-session.
    var sessionSettings = {
        // The cookie here is configured with maxAge of one year AND ONE MILLISECOND.
        // No, seriously, who was the genius that thought cookies age should be in ms??
        cookie: { path: '/', httpOnly: true, secure: false, maxAge: 31104000001 },
        name: 'noumena-session',
        resave: true,
        saveUninitialized: true,
        secret: config.secret, // Make sure you edit this in your config.
        store: new MongoStore({mongooseConnection: mongoose.connection})
    };

    // Provide a way to call admin-only pages, that can redirect to login and back.
    // This is based on setting req.session.returnTo, and reading it on the login route.
    app.adminOnly = function(callback) {
        return function(req, res) {
            if (req.user && req.user.admin) {
                callback(req, res);
            } else {
                req.flash('bad', 'You must be logged in as an admin to view that page.');
                req.session.returnTo = req.originalUrl;
                res.redirect('/login');
            }
        };
    };

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    // Set up middleware.
    app.use(compression());
    app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(session(sessionSettings));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());

    // Load some variables for templates.
    app.all('*', function(req, res, next) {
        res.locals.loggedIn = !!req.user;
        res.locals.currentUser = req.user;
        res.locals.autoincrement = autoincrement;
        next();
    });

    // Routes only need to be app.use()d to work, in our workflow.
    var routes = requireDir('./routes');
    for (var i in routes) app.use('/', routes[i]);

    /// catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // Error handler. only in development stacktrace will be printed.
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: app.get('env') === 'development' ? err : {}
        });
    });
});

require('./app/setup')();
