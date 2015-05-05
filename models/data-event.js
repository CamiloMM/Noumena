var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// A data event holds an object that represents the event.
// There are many possible properties for it, besides custom ones.
// Be sure to check the readme, as it contains technical notes.

var dataEventSchema = new Schema({
    project   : String,
    category  : String,
    action    : String,
    count     : {type: Number, default: 0},
    hash      : String, // MD5 hex string of data object, generated via object-hash module.
    data      : {} // Note this technically means mixed; we need to enforce object.
});

var DataEvent = mongoose.model('DataEvent', dataEventSchema);

module.exports = DataEvent;
