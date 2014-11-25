var test = require('tape');
var sax = require('sax');
var microdom = require('../microdom.js');

var inherits = require('util').inherits;

test('constructor - xml string', function(t) {
  var dom = microdom('<a href="/test">testing</a>');
  t.equal(1, dom.length());
  t.equal('/test', dom.child(0).attr('href'));
  t.equal('testing', dom.child(0).child(0).value);
  t.end();
});

test('constructor - empty dom when no xml is passed', function(t) {
  var dom = microdom();
  t.equal(0, dom.length());
  t.end();
});

test('constructor -  accepts a parser and optional callback', function(t) {
  var parser = sax.createStream(true);
  var dom = microdom(parser, function() {
    t.equal('testing', this.child(0).attr('class'));
    t.end();
  });

  parser.end('<a class="testing">blah</a>');
});

test('child - return the node at specified index', function(t) {
  var node = microdom().append({});
  t.equal(node.parent.child(0), node);
  t.end();
});

test('child - return null when passed an invalid index', function(t) {
  var node = microdom().append({});
  t.equal(node.parent.child(-1), null);
  t.equal(node.parent.child(10), null);
  t.end();
});

test('buildNode - should add .value if specified', function(t) {
  var dom = microdom();
  var node = dom.buildNode('a', { href : '/test'}, 'test link')[0];
  t.equal('/test', node.attr('href'));
  t.equal('test link', node.value);
  t.equal('a', node.name);
  t.end();
});

test('prepend - shift onto the front instead of push', function(t) {
  var dom = microdom().append({}).owner;
  var node = dom.prepend({ first: true });

  t.ok(dom.child(0).attr('first'));
  t.end();
});

test('prepend - setup the name if passed', function(t) {
  t.equal('a', microdom().prepend('a', {
    test: 123
  }).name);
  t.end();
});

test('prepend - setup the owner property', function(t) {
  var dom = microdom();
  t.equal(dom, dom.prepend({}).owner);
  t.end();
});

test('prepend - setup the parent attribute', function(t) {
  var node = microdom().append({});

  t.equal(node, node.prepend({}).parent);
  t.end();
});

test('prepend - remove from an existing parent', function(t) {
  var dom = microdom();
  var parent1 = dom.append({});
  var parent2 = dom.append({});
  var child = parent1.append({});

  t.equal(child.parent, parent1);
  t.equal(1, parent1.length());
  t.equal(0, parent2.length());


  parent2.prepend(child);

  t.equal(child.parent, parent2);
  t.equal(0, parent1.length());
  t.equal(1, parent2.length());
  t.end();
});

test('prepend - update children owner properties', function(t) {
  var dom = microdom();
  var dom2 = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  node.append({});

  t.ok(node.child(0).owner === dom);

  dom2.prepend(node);

  t.ok(node.child(0).owner === dom2);
  t.end();
});

test('prepend - be able to prepend raw xml', function(t) {
  var dom = microdom();
  dom.append({ last : true });

  dom.prepend('<a /><b />');

  t.ok('a', dom.child(0).name);
  t.ok('b', dom.child(1).name);
  t.ok(dom.child(2).attr('last'));
  t.end();
});


test('append - add a child to the end of the list', function(t) {
  t.equal(1, microdom().append({
    some: 'attributes',
    id: 'test'
  }).owner.length());
  t.end();
});

test('append - setup the name if passed', function(t) {
  t.equal('a', microdom().append('a', {
    test: 123
  }).name);
  t.end();
});

test('append - sets up the owner property', function(t) {
  var dom = microdom();
  t.equal(dom, dom.append({}).owner);
  t.end();
});

test('should setup the parent attribute', function(t) {
  var node = microdom().append({});

  t.equal(node, node.append({}).parent);
  t.end();
});

test('append - remove from an existing parent', function(t) {
  var dom = microdom();
  var parent1 = dom.append({});
  var parent2 = dom.append({});
  var child = parent1.append({});

  t.equal(child.parent, parent1);
  t.equal(1, parent1.length());
  t.equal(0, parent2.length());


  parent2.append(child);

  t.equal(child.parent, parent2);
  t.equal(0, parent1.length());
  t.equal(1, parent2.length());
  t.end();
});

test('append - update children owner properties', function(t) {
  var dom = microdom();
  var dom2 = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  node.append({});

  t.ok(node.child(0).owner === dom);

  dom2.append(node);

  t.ok(node.child(0).owner === dom2);
  t.end();
});

test('should be able to append raw xml', function(t) {
  var dom = microdom();
  dom.append({ last : true });

  dom.append('<a /><b />');
  t.ok('a', dom.child(1).name);
  t.ok('b', dom.child(2).name);
  t.ok(dom.child(0).attr('last'));
  t.end();
});

test('indexOf - return the index of a child', function(t) {
  var dom = microdom();
  var a = dom.append({ name : 'a' });
  var b = dom.append({ name : 'b' });
  var c = dom.append({ name : 'c' });

  t.equal(1, dom.indexOf(b));
  t.end();
});

test('indexOf - return -1 when the node is not found', function(t) {
  t.equal(-1, microdom().indexOf(null));
  t.end();
});


test('remove - remove a child by reference', function(t) {
  var dom = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  var res = dom.remove(node);

  t.equal(0, dom.length());
  t.ok(res === node);
  t.ok(res.parent === null);

  // Ownership is not updated until the
  // orphan changes doms
  t.ok(res.owner === dom);
  t.end();
});

test('remove - remove a child by index', function(t) {
  var dom = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  var res = dom.remove(0);

  t.equal(0, dom.length());
  t.ok(res === node);
  t.ok(res.parent === null);

  // Ownership is not updated until the
  // orphan changes doms
  t.ok(res.owner === dom);
  t.end();
});

test('remove - return null when provided an invalid index', function(t) {
  var dom = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  var res = dom.remove(-1);
  t.equal(1, dom.length());
  t.ok(res === null);
  t.end();
});

test('remove - update children owner properties', function(t) {
  var dom = microdom();
  var node = dom.append({
    some: 'attributes',
    id: 'test'
  });

  node.append({});

  var res = dom.remove(0);
  t.equal(0, dom.length());
  t.ok(res === node);

  // Ownership is not updated until the
  // orphan changes doms
  t.ok(res.child(0).owner === dom);
  t.end();
});

test('attr - set when value is provided', function(t) {
  var node = microdom().append({
    hello : 123
  });

  node.attr('hello2', 321);

  t.equal(123, node.attr('hello'));
  t.equal(321, node.attr('hello2'));
  t.end();
});

test('attr - accept an object', function(t) {
  var node = microdom().append();

  node.attr({
    a: 1,
    b: 2
  });

  t.equal(1, node.attr('a'));
  t.equal(2, node.attr('b'));
  t.end();
});

test('parser - parse basic xml', function(t) {

  var xml = '<a class="monkey" href="/test">hello</a>';
  var node = microdom.parse(xml);

  t.equal('a', node.name);
  t.equal('monkey', node.attr('class'));
  t.equal('/test', node.attr('href'));
  t.equal('hello', node.child(0).value);
  t.end();
});

test('parser - nest children', function(t) {
  var xml = [
    '<div class="test">',
      '<a class="monkey" href="/test">hello</a>',
      '<a class="monkey" href="/test2">hello2</a>',
    '</div>'
  ].join('\n');

  var node = microdom.parse(xml);

  t.equal(5, node.length());
  t.equal('/test', node.child(1).attr('href'));
  t.equal('/test2', node.child(3).attr('href'));
  t.end();
});

test('parser - handle interspersed text', function(t) {
  var xml = [
    '<div class="test">',
      'hello <span class="bold">world</span>!',
    '</div>'
  ].join('\n');

  var node = microdom.parse(xml);
  t.equal(3, node.length());
  t.equal('bold', node.child(1).attr('class'));
  t.equal('world', node.child(1).child(0).value);
  t.end();
});

test('parser - keep casing of tags', function(t) {
  var xml = '<A /><a /><aBc />';

  var array = microdom.parse(xml);

  t.equal(3, array.length);
  t.equal('A', array[0].name);
  t.equal('a', array[1].name);
  t.equal('aBc', array[2].name);
  t.end();
});

test('parser tag mapping - override tag names', function(t) {
  var called = false;
  function Anchor() {
    this.type = "anchor";
    microdom.MicroNode.apply(this, arguments);
  }

  inherits(Anchor, microdom.MicroNode);

  Anchor.prototype.click = function(t) {
    called = true;
  };

  microdom.tag('a', Anchor);
  var node = microdom('<a />').child(0);
  node.click();

  // cleanup after ourselves
  microdom.tag('a', null);

  t.ok(called);
  t.equal('anchor', node.type);
  t.end();
});

test('events - attribute mutation', function(t) {
  var dom = microdom();
  var a = dom.append('a');

  a.attr('class', 'biglink');

  dom.on('~attr.class', function(node, oldValue, attributeValue) {
    t.equal(node, a);
    t.equal('biglink', oldValue);
    t.equal('small', attributeValue);
    t.end();
  });

  a.attr('class', 'small');
});

test('events - attribute addition', function(t) {
  var dom = microdom();
  var a = dom.append('el');

  dom.on('+attr.class', function(node, oldValue, attributeValue) {
    t.equal(node, a);
    t.equal('biglink', attributeValue);
    t.end();
  });

  a.attr('class', 'biglink');
});

test('events - attribute removal', function(t) {
  var dom = microdom();
  var a = dom.append('el', { 'class' : 'biglink' });

  dom.on('-attr.class', function(node, oldValue, attributeValue) {
    t.equal(node, a);
    t.equal('biglink', oldValue);
    t.equal(null, attributeValue);
    t.end();
  });

  a.attr('class', null);
});

test('events - node addition', function(t) {
  var dom = microdom();

  dom.on('+node', function(node) {
    t.equal(node, dom.child(0));
    t.equal('a', node.name);
    t.end();
  });

  var a = dom.append('a');
});

test('events - node prepend', function(t) {
  var dom = microdom();

  dom.on('+node', function(node) {
    t.ok(node === dom.child(0));
    t.equal('a', node.name);
    t.end();
  });

  dom.prepend('a');
});

test('events - node removal', function(t) {
  var dom = microdom();

  dom.on('-node', function(node) {
    t.equal(node, a);
    t.equal('a', node.name);
    t.end();
  });

  var a = dom.append('a');
  dom.remove(a);
});

test('plugin - mutates MicroNode.prototype', function(t) {
  var node = new microdom.MicroDom();

  t.ok(!node.objectPlugin);

  microdom.plugin({
    objectPlugin: true
  });

  t.ok(node.objectPlugin);
  t.ok(microdom.MicroNode.prototype.objectPlugin);
  t.end();
});

test('plugin - accepts a function', function(t) {
  var called = false;
  microdom.plugin(function(proto) {
    proto.pluggedIn = true;
  });

  t.ok(microdom.MicroNode.prototype.pluggedIn);
  t.end();
});

test('plugin - getElementsByTagName', function(t) {

  var dom = microdom([
    '<outer><child><grandchild><leaf class="a"/>',
    '<leaf class="b"/></grandchild></child></outer>'].join('')
  );

  microdom.plugin({
    getElementsByTagName : function(name) {

      var ret = [], c = this.children(), l = this.length();
      for (var i=0; i<l; i++) {
        Array.prototype.push.apply(ret, c[i].getElementsByTagName(name));
      }

      if (this.name === name) {
        ret.push(this);
      }

      return ret;
    }
  });

  var nodes = dom.getElementsByTagName('leaf');
  t.equal(2, nodes.length);
  t.equal('a', nodes[0].attr('class'));
  t.equal('b', nodes[1].attr('class'));
  t.end();
});

