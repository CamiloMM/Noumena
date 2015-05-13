var mongoose    = require('mongoose');
var _           = require('lodash');
var SimpleEvent = mongoose.model('SimpleEvent');
var DataEvent   = mongoose.model('DataEvent');

// This file contains code for some database operations.
// I've decided to abstract them in a single file so other files
// don't have to worry about db logic.

// project, category and action are namespace fragments.
// This function ensures the fragment is trimmed and doesn't contain slashes.
function normalizeNamespaceFragment(fragment) {
    return fragment.trim().replace(/[\/\\]/g, '');
}

// Gets projects, and gives them to a callback that does something with them.
// Will call the callback with an array of project names, or null on error.
exports.getProjects = function(callback) {
    SimpleEvent.distinct('project', function(err1, result1) {
        DataEvent.distinct('project', function(err2, result2) {
            if (err1 || err2) return callback(null);
            callback(_.uniq(result1.concat(result2)).sort());
        });
    });
};
