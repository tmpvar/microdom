var sax = require('sax');
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;
var tags = {};

var isNumber = function(v) {
  return (typeof v === 'number' || v instanceof Number);
};

var isString = function(v) {
  return (typeof v === 'string' || v instanceof String);
};

var isArray = Array.isArray || function(v) {
  return (v instanceof Array);
};


function parserRigging(parser, root) {
  var loc = root;

  parser.on('opentag', function(node) {
    var unode = new (tags[node.name] || MicroNode)(node.attributes);
    unode.name = node.name;

    loc = loc.append(unode);
  });

  parser.on('text', function(text) {
    loc && loc.append('text', {}, text);
  });

  parser.on('error', function(error) {
    if (!root.errors) {
      root.errors = [];
    }
    root.errors.push(error);
  });

  parser.on('closetag', function() {
    loc = loc.parent;
  });
}


function parse(string, root) {
  var parser;
  if (!isString(string)) {
    parser = string;
  } else {
    parser = sax.createStream(true);
  }

  root = root || new MicroNode();

  parserRigging(parser, root);

  // Internal control of the parser
  if (isString(string)) {
    parser.end(string);
  }

  if (root.length() > 1) {
    return root.children();
  } else {
    return root.child(0);
  }
}

function MicroNode(attrs) {
  EventEmitter.call(this);
  this.attributes = {};
  attrs && this.attr(attrs);
  this._children = [];
}

inherits(MicroNode, EventEmitter);

MicroNode.prototype.isNode = true;
MicroNode.prototype._children = null;
MicroNode.prototype.attributes = null;
MicroNode.prototype.parent = null;
MicroNode.prototype.owner = null;

MicroNode.prototype.child = function(index) {
  return this._children[index] || null;
};

MicroNode.prototype.children = function() {
  return this._children;
};

MicroNode.prototype.length = function() {
  return this._children.length;
};

MicroNode.prototype.buildNode = function(name, obj, textContent) {

  if (!isString(name)) {
    obj = name;
    name = null;
  } else if (
    typeof obj === 'undefined' &&
    typeof textContent === 'undefined' &&
    name.indexOf('<') > -1
    )
  {
    // handle xml
    obj = parse(name);
    return obj;
  }

  if (!obj || !obj.isNode) {
    obj = (tags[name]) ? new tags[name](obj) : new MicroNode(obj);
  }

  if (name) {
    obj.name = name;
  }

  if (obj.parent) {
    obj.parent.remove(obj);
  }

  obj.parent = this;

  if (textContent) {
    obj.value = textContent;
  }

  obj.own(this.owner || this);

  return (isArray(obj)) ? obj : [obj];
};

MicroNode.prototype.prepend = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  var children = this.children();

  for (var i=0; i<obj.length; i++) {
    children.unshift(obj[i]);
    obj[i].owner && obj[i].owner.emit('+node', obj[i]);
  }
  return (obj.length === 1) ? obj[0] : obj;
};

MicroNode.prototype.append = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  var children = this.children();

  for (var i=0; i<obj.length; i++) {
    children.push(obj[i]);
    obj[i].owner && obj[i].owner.emit('+node', obj[i]);
  }
  return (obj.length === 1) ? obj[0] : obj;
};

MicroNode.prototype.indexOf = function(node) {
  var c = this.children(), l = this.length(), i = -1;
  if (l) {
    for (i = 0; i<l; i++) {
      if (node === c[i]) {
        break;
      }
    }
  }

  return i;
};

MicroNode.prototype.own = function(owner) {
  if (this.owner !== owner) {
    var c = this.children(), l = this.length();
    this.owner = owner;

    if (l) {
      for (var i = 0; i<l; i++) {
        c[i].own(owner);
        c[i].owner = owner;
      }
    }
  }

  return this;
};

MicroNode.prototype.remove = function(node) {
  var c = this.children(), l = this.length();

  if (l) {
    if (isNumber(node)) {
      if (node < 0 || node >= l) {
        return null;
      }

      node = c.splice(node, 1)[0];
    } else {
      for (var i = 0; i<l; i++) {
        if (node === c[i]) {
          c.splice(i, 1);
        }
      }
    }
  }

  node.parent = null;

  node.owner && node.owner.emit('-node', node);

  return node;
};

MicroNode.prototype.attr = function(name, value) {
  var a = this.attributes;
  if (typeof value !== 'undefined') {
    var op = '~';
    var old = a[name] || null;
    a[name] = value;

    if (value === null) {
      op = '-';
    } else if (old === null) {
      op = '+';
    }

    this.owner && this.owner.emit(op + 'attr.' + name, this, old, value);

  } else if (isArray(name) || typeof name === 'object') {
    for (key in name) {
      if (name.hasOwnProperty(key)) {
        this.attr(key, name[key]);
      }
    }
  }

  return a[name] || null;
}

function MicroDom() {
  MicroNode.call(this);
}

inherits(MicroDom, MicroNode);

function microdom(xml, fn) {
  var dom = new MicroDom();

  if (xml) {
    parse(xml, dom);
    if (!isString(xml) && typeof fn == 'function') {
      xml.on('end', function() {
        fn.call(dom);
      });
    }
  }

  return dom;
};

microdom.tag = function(name, ctor) {
  tags[name] = ctor;
};

microdom.plugin = function(o) {
  var proto = MicroNode.prototype;
  if (typeof o === 'function') {
    o(proto);
  } else {
    for (var key in o) {
      if (o.hasOwnProperty(key)) {
        proto[key] = o[key];
      }
    }
  }
};

microdom.createParserStream = function(parent, strict, options) {
  var parser = sax.createStream(strict);
  var parent = parent || new MicroDom();
  parserRigging
  parserRigging(parser, parent);

  parser.on('end', function() {
    parser.emit('dom', parent);
  });

  return parser;
};

microdom.parse = parse;
microdom.MicroNode = MicroNode;
microdom.MicroDom = MicroDom;
microdom.sax = sax;

if (typeof module !== 'undefined' && typeof module.exports == 'object') {
  module.exports = microdom;
}

if (typeof window !== 'undefined') {
  window.microdom = window.microdom || microdom;
}
