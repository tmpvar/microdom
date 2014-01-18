var sax = require('sax');

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

function parse(string, root) {
  var parser;
  if (!isString(string)) {
    parser = string;
  } else {
    parser = sax.createStream(true);
  }

  var loc;
  root = root || new MicroNode();
  parser.on('opentag', function(node) {

    var Ctor = tags[node.name] || MicroNode;
    var unode = new Ctor(node.attributes);
    unode.name = node.name;

    if (!loc) {
      loc = root;
    }

    loc.append(unode);
    loc = unode;
  });

  parser.on('text', function(text) {
    var node = loc.append('text', {}, text);
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
  this.attributes = attrs || {};
  this._children = [];
}

MicroNode.prototype.isNode = true;

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

  return obj;
};

MicroNode.prototype.prepend = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  if (isArray(obj)) {
    Array.prototype.unshift.apply(this.children(), obj);
  } else {
    this.children().unshift(obj);
  }
  return obj;
};

MicroNode.prototype.append = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  if (isArray(obj)) {
    Array.prototype.push.apply(this.children(), obj);
  } else {
    this.children().push(obj);
  }
  return obj;
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

  return node;
};

// Attribute getter/setter
MicroNode.prototype.attr = function(name, value) {
  if (typeof value !== 'undefined') {
    this.attributes[name] = value;
  }

  return this.attributes[name] || null;
};

function MicroDom() {
  MicroNode.call(this);
}

MicroDom.prototype = new MicroNode();

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
    Object.keys(o).forEach(function(key) {
      proto[key] = o[key];
    });
  }
};

microdom.parse = parse;
microdom.MicroNode = MicroNode;
microdom.MicroDom = MicroDom;
microdom.sax = sax;

if (typeof module !== 'undefined' && typeof module.exports == 'object') {
  module.exports = microdom;
} else {
  window.microdom = window.microdom || microdom;
}
