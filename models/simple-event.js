var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// A simple event is an event which does not contain data associated with it, and
// instead just records "it happened", the count field incrementing with each hit.
// For many events this is viable enough, and can be optimized to be way faster.

var simpleEventSchema = new Schema({
    project   : String,
    category  : String,
    action    : String,
    count     : {type: Number, default: 0}
});

var SimpleEvent = mongoose.model('SimpleEvent', simpleEventSchema);

module.exports = SimpleEvent;
