var $        = require('jquery');
var _        = require('lodash');
var utils    = require('./src/utils.js');
var autoload = require('./src/autoload.js')

var pages = [
    require('./src/index')
];

$(function() {
    autoload(utils, $, _);
    for (var i = 0; i < pages.length; i++) {
        pages[i](utils, $, _);
    };
});
