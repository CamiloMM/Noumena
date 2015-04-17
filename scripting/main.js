var $     = require('jquery');
var _     = require('lodash');
var utils = require('./src/utils');

var modules = [
    require('./src/autoload'),
    require('./src/flash'),
    require('./src/index')
];

$(function() {
    for (var i = 0; i < modules.length; i++) {
        modules[i](utils, $, _);
    };
});
