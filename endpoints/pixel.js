var endpoint = require('../app/endpoint');
var fs       = require('fs');

// This endpoint is like the HTTP GET one, but returns a 1x1 transparent
// pixel image. The type of the image can be specified by the extension
// (.gif, .png and .svg), the sizes being 32, 67 and 62 bytes respectively.
// The default is a GIF image when you don't pass an extension.

// The transparent pixels, as buffers. This way they're only loaded once at startup.
var pixels = {
    gif: {mime: 'image/gif'    , data: fs.readFileSync('../graphics/transparent.gif')},
    png: {mime: 'image/png'    , data: fs.readFileSync('../graphics/transparent.png')},
    svg: {mime: 'image/svg+xml', data: fs.readFileSync('../graphics/transparent.svg')},
};

// The name is "px" for "pixel".
endpoint.register('http/GET/px', function(req, res, args) {
    var exts = /^(gif|png|svg)$/i;
    endpoint.parseArgs(args, exts, req, 'pixel', function(err, parsed) {
        if (err) return res.sendStatus(500);
        if (!parsed) return res.sendStatus(400);
        var pixel = pixels[parsed.ext] || pixels['gif'];
        endpoint.db.registerEvent(parsed, function(error) {
            res.set('Content-Type', pixel.mime);
            res.status(error ? 500 : 200).send(pixel.data);
        });
    });
});
