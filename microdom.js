var sax = require('sax');

function parse(string) {
  var parser = sax.parser(true);

  var loc, root;
  parser.onopentag = function(node) {
    var unode = new MicroNode(node.attributes);
    unode.name = node.name;

    if (!root) {
      root = unode;
      loc = root;
    } else {
      loc.append(unode);
      loc = unode;
    }
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

  return root;

};


function MicroNode(attrs) {
  this.attributes = attrs || {};
  this.children = [];
}

MicroNode.prototype.isNode = true;

MicroNode.prototype.prepend = function(obj) {
  if (!obj.isNode) {
    obj = new MicroNode(obj);
  }

  if (obj.parent) {
    obj.parent.remove(obj);
  }

  obj.parent = this;
  obj.owner = this.owner || this;

  this.children.unshift(obj);
  return obj;
};

MicroNode.prototype.append = function(obj) {
  if (!obj.isNode) {
    obj = new MicroNode(obj);
  }

  if (obj.parent) {
    obj.parent.remove(obj);
  }

  obj.parent = this;
  obj.owner = this.owner || this;

  this.children.push(obj);
  return obj;
};

MicroNode.prototype.indexOf = function(node) {
  var c = this.children, l = c.length, i = -1;
  if (l) {
    for (i = 0; i<l; i++) {
      if (node === c[i]) {
        break;
      }
    }
  }

  return i;
};

MicroNode.prototype.remove = function(node) {
  var c = this.children, l = c.length;

  if (l) {
    for (var i = 0; i<l; i++) {
      if (node === c[i]) {
        c.splice(i, 1);
      }
    }
  }

  return this;
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


