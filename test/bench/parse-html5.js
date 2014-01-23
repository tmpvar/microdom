var microdom = require('../../microdom');
var fs = require('fs');
var path = require('path');
var sax = require('sax');

var start = Date.now();
var dom = microdom();

var nodes = 0;
dom.on('+node', function(a) {
  nodes++;
});

fs.createReadStream(path.join(__dirname, 'html5.html')).pipe(microdom.createParserStream(dom)).on('end', function() {
  console.log(Date.now() - start);
  console.log('found', nodes, 'nodes');
});
