var mongoose    = require('mongoose');
var _           = require('lodash');
var objectHash  = require('object-hash');
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

// Records a simple event, i.e., one without a data object.
// A callback(error) can be passed.
exports.registerSimpleEvent = function(project, category, action, callback) {
    var normalized = {
        project : normalizeNamespaceFragment(project),
        category: normalizeNamespaceFragment(category),
        action  : normalizeNamespaceFragment(action)
    };
    var update = {
        $setOnInsert: normalized,
        $inc: {count: 1}
    };
    var options = {upsert: true, select: {}};
    SimpleEvent.findOneAndUpdate(normalized, update, options, function(e) {
        if (callback) callback(e);
    });
};

// Registers a data event. This is more involved than a simple event, and
// involves hashing. Flags are part of the data event logic, but should be
// handled prior to this step (in other words, the data object passed
// is expected to be final).
exports.registerDataEvent = function(project, category, action, data, callback) {
    var hash = {hash: objectHash.MD5(data)};
    var normalized = {
        project : normalizeNamespaceFragment(project),
        category: normalizeNamespaceFragment(category),
        action  : normalizeNamespaceFragment(action)
    };
    var update = {
        $setOnInsert: _.merge({}, normalized, hash, {data: data}),
        $inc: {count: 1}
    };
    var query = _.merge({}, hash, normalized);
    var options = {upsert: true, select: {}};
    DataEvent.findOneAndUpdate(query, update, options, function(e) {
        if (callback) callback(e);
    });
};

// Simplified event registering. Pass an options object with properties
// project, category, action, and optionally, data (which controls whether or not
// the event is a data event), and a callback(error) like usual.
exports.registerEvent = function(options, callback) {
    var o = options;
    if (options.data) {
        exports.registerDataEvent(o.project, o.category, o.action, o.data, callback);
    } else {
        exports.registerSimpleEvent(o.project, o.category, o.action, callback);
    }
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

// Gets a project's categories (if any was found), and passes them to a callback.
// Will call the callback with an array of category names, or null on error/no project.
exports.getCategories = function(project, callback) {
    SimpleEvent.distinct('category', {project: project}, function(err1, result1) {
        DataEvent.distinct('category', {project: project}, function(err2, result2) {
            if (err1 || err2) return callback(null);
            var categories = _.uniq(result1.concat(result2)).sort();
            callback(categories.length ? categories : null);
        });
    });
};
