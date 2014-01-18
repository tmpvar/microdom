var sax = require('sax');

var isNumber = function(v) {
  return (typeof v === 'number' || v instanceof Number);
}

var isString = function(v) {
  return (typeof v === 'string' || v instanceof String);
}

var isArray = function(v) {
  return (typeof v === 'array' || v instanceof Array);
}

function parse(string, root) {
  var parser = sax.parser(true);

  var loc;
  root = root || new MicroNode();
  parser.onopentag = function(node) {
    var unode = new MicroNode(node.attributes);
    unode.name = node.name;

    if (!loc) {
      loc = root;
    }

    loc.append(unode);
    loc = unode;
  }

  parser.ontext = function(text) {
    var node = loc.append('text', {}, text);
  }

  parser.onclosetag = function() {
    loc = loc.parent;
  }

  parser.write(string);

  return (root.length() > 1) ? root._children : root.child(0);

};

function MicroNode(attrs) {
  this.attributes = attrs || {};
  this._children = [];
}

MicroNode.prototype.isNode = true;

MicroNode.prototype.child = function(index) {
  return this._children[index] || null;
}

MicroNode.prototype.length = function() {
  return this._children.length;
}

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
    obj = new MicroNode(obj);
  }

  if (name) {
    obj.name = name;
  }

  if (obj.parent) {
    // TODO: optimize this so it doesn't visit 
    //       then entire tree.
    obj.parent.remove(obj);
  }

  obj.parent = this;

  if (textContent) {
    obj.value = textContent;
  }

  obj.own(this.owner || this);

  return obj;
} 

MicroNode.prototype.prepend = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  if (isArray(obj)) {
    Array.prototype.unshift.apply(this._children, obj);
  } else {
    this._children.unshift(obj);
  }
  return obj;
};

MicroNode.prototype.append = function(name, obj, value) {
  obj = this.buildNode(name, obj, value);
  if (isArray(obj)) {
    Array.prototype.push.apply(this._children, obj);
  } else {
    this._children.push(obj);
  }
  return obj;
};

MicroNode.prototype.indexOf = function(node) {
  var c = this._children, l = c.length, i = -1;
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
  var c = this._children, l = c.length;

  this.owner = owner;

  if (l) {
    for (var i = 0; i<l; i++) {
      c[i].own(owner);
      c[i].owner = owner;
    }
  }

  return this;
};

MicroNode.prototype.remove = function(node) {
  var c = this._children, l = c.length;

  if (l) {
    if (isNumber(node)) {
      if (node < 0 || node >= l) {
        return null
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

  node.own(null);

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
};

MicroDom.prototype = new MicroNode();


module.exports = function(xml) {
  var dom = new MicroDom();
  xml && parse(xml, dom);
  return dom;
}

module.exports.parse = parse;
