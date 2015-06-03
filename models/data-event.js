var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// A data event holds an object that represents the event.
// There are many possible properties for it, besides custom ones.
// Be sure to check the readme, as it contains technical notes.

var dataEventSchema = new Schema({
    project   : String,
    category  : String,
    action    : String,
    count     : {type: Number, default: 0, index: true},
    // MD5 hex string of data object, generated via object-hash module.
    hash      : {type: String, index: {unique: true}},
    data      : {} // Note this technically means mixed; we need to enforce object.
});

// Compound index because these fields are treated like namespaces.
dataEventSchema.index({project: 1, category: 1, action: 1});

// These fields may (or may not) be set by flags, so they are sparsely indexed.
dataEventSchema.index({'data.ip'         : 1   }, {sparse: true});
dataEventSchema.index({'data.geo'        : '2d'}, {sparse: true});
dataEventSchema.index({'data.country'    : 1   }, {sparse: true});
dataEventSchema.index({'data.time'       : 1   }, {sparse: true});
dataEventSchema.index({'data.agent'      : 1   }, {sparse: true});
dataEventSchema.index({'data.browser'    : 1   }, {sparse: true});
dataEventSchema.index({'data.os'         : 1   }, {sparse: true});
dataEventSchema.index({'data.device'     : 1   }, {sparse: true});
dataEventSchema.index({'data.fingerprint': 1   }, {sparse: true});
dataEventSchema.index({'data.num'        : 1   }, {sparse: true, unique: true});
dataEventSchema.index({'data.endpoint'   : 1   }, {sparse: true});

var DataEvent = mongoose.model('DataEvent', dataEventSchema);

module.exports = DataEvent;
