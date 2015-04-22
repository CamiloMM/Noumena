var path         = require('path');
var less         = require('less');
var fs           = require('fs');
var crypto       = require('crypto');
var chokidar     = require('chokidar');
var browserify   = require('browserify');
var UglifyJS     = require('uglify-js');
var LessCleanCSS = require('less-plugin-clean-css');
var debug        = require('debug')('Noumena:setup');
var app          = require('../app.js');

var errors = app.locals.settings.errors;

function buildCss(next, ensureDirectory) {
    var lessCleanCSS = new LessCleanCSS({
        advanced: false, // It's buggy, was removing a background-clip:padding-box rule.
        keepSpecialComments: false
    });
    var code = fs.readFileSync(process.cwd() + '/all.less', {encoding: 'utf8'});
    var options = {
        paths    : [process.cwd()],
        filename : "all.less",
        compress : true,
        ieCompat : false,
        plugins  : [lessCleanCSS]
    };
    less.render(code, options, function(error, output) {
        ensureDirectory();

        if (error) {
            errors.css = error;
            return less.writeError(error, options);
        }

        app.set('css', {
            md5:  crypto.createHash('md5').update(output.css).digest('hex'),
            code: output.css
        });

        next();
    });
}

function buildJs(next, ensureDirectory) {
    var b = browserify();
    b.add('./main.js');
    b.bundle(function(err, buf) {
        ensureDirectory();

        if (err) {
            errors.jsBundle = err;
            var js = 'alert("JS build error!\n\n"+' + JSON.stringify(String(err)) + ');';
        } else {
            var js = buf.toString();
        }

        var options = {
            fromString : true,
            mangle     : {screw_ie8: true},
            compress   : {
                booleans      : true,
                cascade       : true,
                comparisons   : true,
                conditionals  : true,
                dead_code     : true,
                drop_console  : false,
                drop_debugger : false,
                evaluate      : true,
                hoist_funs    : true,
                if_return     : true,
                join_vars     : true,
                loops         : true,
                negate_iife   : true,
                properties    : true,
                screw_ie8     : true,
                sequences     : true,
                unused        : true
            }
        };

        try {
            var minified = UglifyJS.minify(js, options).code;
        } catch (e) {
            errors.jsMinify = e;
        }

        app.set('js', {
            md5:  crypto.createHash('md5').update(minified).digest('hex'),
            code: minified
        });

        next();
    });
}

// Auto-compilation abstraction. You give it a directory path, and a compilation routine.
// The routine will be executed in the directory specified, and this directory will be
// watched for changes, running this compile step again when changes are detected.
// If the routine needs to be async, we'll pass it a "next" argument.
function autoCompile(directory, routine) {
    var absolute = path.resolve(__dirname, directory);
    function compile() {
        var originalDirectory = process.cwd();
        var ensureDirectory = process.chdir.bind(process, absolute);
        var next = process.chdir.bind(process, originalDirectory);
        try {
            ensureDirectory();
            routine(next, ensureDirectory);
        } catch (e) {
            errors.compileRoutine = e;
            debug('Compile routine error for ' + directory + ': \n' + e);
            next();
        }
        next();
    }
    compile();
    var watcher = chokidar.watch(absolute);
    var timeout = null;
    watcher.on('all', function change() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        timeout = setTimeout(function() {
            compile();
            timeout = null;
        }, 150);
    });
    // It's not like Chokidar is particularly helpful when it flops over and dies, but...
    watcher.on('error', function(error) {
        errors.chokidar = error;
        debug('Chokidar error: ' + error);
    });
}

// This setup mechanism is invoked before starting the server.
function setup() {
    try {
        autoCompile('../stylesheets', buildCss);
        autoCompile('../scripting', buildJs);
    } catch(e) {
        errors.setup = e;
    }
}

module.exports = setup;
