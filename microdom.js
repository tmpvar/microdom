var sax = require('sax');

var isNumber = function(v) {
  return (typeof v === 'number' || v instanceof Number);
}

function parse(string) {
  var parser = sax.parser(true);

  var loc, root = new MicroNode();
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
    var node = loc.append({});
    node.name = "text";
    node.value = text;
  }

  parser.onclosetag = function() {
    loc = loc.parent;
  }

  parser.write(string);

  return (root._children.length > 1) ? root : root._children[0];

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

MicroNode.prototype.prepend = function(obj) {
  if (!obj.isNode) {
    obj = new MicroNode(obj);
  }

  if (obj.parent) {
    obj.parent.remove(obj);
  }

  obj.parent = this;
  obj.own(this.owner || this);

  this._children.unshift(obj);
  return obj;
};

MicroNode.prototype.append = function(obj) {
  if (!obj.isNode) {
    obj = new MicroNode(obj);
  }

  if (obj.parent) {
    // TODO: optimize this so it doesn't visit 
    //       then entire tree.
    obj.parent.remove(obj);
  }

  obj.parent = this;

  obj.own(this.owner || this);

  this._children.push(obj);
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


module.exports = function() {
  return new MicroDom();
}

module.exports.parse = parse;
