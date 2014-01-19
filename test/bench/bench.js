var suite = new (require('benchmark').Suite)();
var microdom = require('../../microdom');
var fs = require('fs');
var path = require('path');
var htmlspec = fs.readFileSync(path.join(__dirname, 'html5.html')).toString();

suite.add('parse', function() {
  microdom(htmlspec);
}).run();

