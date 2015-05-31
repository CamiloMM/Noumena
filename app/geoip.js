var path = require('path');
var mmdb = require('maxmind-db-reader');
var _    = require('lodash');

// GeoIP logic is contained (and abstracted) in this file.
// We currently use GeoLite data created by MaxMind, available from:
// http://dev.maxmind.com/geoip/legacy/geolite/

var dbPath = path.join(__dirname, '../geoip/GeoLite2-City.mmdb');
var cities = mmdb.openSync(dbPath);

// Pass an IP (v4 or v6), and a callback(err, data) where data is an
// object with keys lat, lon, country (uppercase ISO 3166-1 alpha-2).
exports.locate = function(ip, callback) {
    callback = _.once(callback);
    setTimeout(function() { callback(new Error('GeoIP timeout!')); }, 2000);
    cities.getGeoData(ip, function(err, geo) {
        if (err) return callback(err);
        if (!geo || !geo.location || !geo.country) return callback(new Error('No data!'));
        var data = {}; // Loose coupling, so we re-build it ourselves.
        data.lat = Math.round(geo.location.latitude * 1e6) / 1e6 || 0;
        data.lon = Math.round(geo.location.longitude * 1e6) / 1e6 || 0;
        data.country = geo.country.iso_code || 'ZZ';
        callback(null, data);
    });
};
