## microdom

A tiny dom that is not compliant with the w3c dom specifcation

![travis](https://api.travis-ci.org/tmpvar/microdom.png)

[![browser support](https://ci.testling.com/tmpvar/microdom.png)](http://ci.testling.com/tmpvar/microdom)

## Why?

After writing jsdom, some things have been bugging me.

 * how much of the dom do I actually need?
 * why are the methods specified in the dom so obtuse?
 * what if I want to abuse the dom and use it for storage?
 * how do I get the dom to be faster?

I'll attempt to answer these questions with this library.  Sure, it's
non-standard, but in the majority of cases you don't really need the rigidity that the dom spec forces you into.

## So how does it work?

It's simple. There is a constructor called `MicroNode` which is going to be the basis of this library.  `MicroDom` extends off of this and acts as nothing more than a node to keep track of where the root of the document is.  Each `MicroNode` has a reference to it's parent and root, and these are mantained for you when you use the management methods specified below.

`MicroNode`s have node idea what a normal html element is and whether or not they are one.  For many cases, it is not important. Especially in an environment where there there are no graphics being displayed or users to create input events.  read: node.js or in a webworker

__there is no such thing as a live nodelist__ \*waves spoon\*

These are by far the biggest performance killer of a dom, and this library sidesteps this inefficiency by (hatefully?) ignoring it.

The key to going fast is doing less.

## I want to go fast too!

You can!  You'll need to install this library, which is pretty simple.  There are a couple ways to do this:

### node

```
npm install microdom
```

### browser

```html
<script type="text/javascript" src="http://raw.github.com/tmpvar/microdom/master/microdom.min.js"></script>
```


## Ok, I'm ready to go fast now.....


Alright, let's start off with something simple

```javascript

// var microdom = require('microdom'); // node

var dom = microdom('<base href="http://url.com"/><a href="/test">tmpvar</a>');
console.log(dom.child(1).attr('href')); // /test

```

That was pretty easy, right? Ok, lets talk about it for a second.  You may have noticed that the `href` attribute has not been messed with.  That is by design!  

Huh?

Well, the idea is that if you need to convert an `href` or do special processing on attributes/nodes, you should probably do that when you need it.  If I tried to handle all of the cases for you, then I'd just be building jsdom again!

Put another way, if you need the `href` of an anchor to resolve based on the `<base>` element of the page or some other logic, write a module that does exactly that.

See the [Extending the microdom](#extending-the-microdom) section below

## Sounds good, what methods can I use?

to create a new dom use the `microdom([xml])` method which may be passed an optional xml string.

If you have an instance of a sax parser, you can pass that instead and `microdom` will rig up the events for you and return you the dom immediately.  It will probably take a bit before the entire dom is populated so you'll want to wait 
for the parser stream to finish before operating on the dom!

Here's what that looks like:

```javascript

var sax = require('sax');
var microdom = require('microdom');
var parser = sax.parser(true);

var dom = microdom(parser, function() {
  console.log(this.child(0).attr('class')) // 'testing'
});

parser.end('<a class="testing">blah</a>')

```


### append

create a new node and append it to `node`

```javascript
var anchor = node.append('a', { href : 'http://tmpvar.com' })`
```

append an existing `node` to another's children array

```javascript
node.append(anotherNode);
```

append some xml

```javascript
node.append('<a href="test">testing</a>');
```

In either case the return value of this function is the node that was
appended

### attr

#### Get/Set attributes on a node

```javascript
node.attr('class', 'small');
console.log(node.attr('class')) // small
```

This will trigger a `+attr.class` event.  Changing the class after this point generates a `~attr.class` event.


#### Ignore attributes
You can also remove attributes by passing `null` as the value like so:

```javascript
var node = microdom().append('a', { class: 'small' });

node.attr('class', null);
```

This will trigger a `-attr.class` event

#### Set a bunch of attributes at once


```javascript
var node = dom.append('a');
node.attr({
  id: 'test',
  class: 'right-aligned'
});

```

_note_: this will emit two events: `+attr.id` and `+attr.class` with the appropriate values.

### child

Get a child at the specified index.  Providing an invalid index will
result in this method returning `null`.

```javascript
var child = node.child(0);
```

### children

Get the array of children that have the node as their parent.

```javascript
var array = node.children();
```

### length

Get the number of children attached to this node

```javascript
var length = node.length();
```

### prepend

works similar to `append` but instead of putting the incoming node at the end of the children array, it will put it at the beginning

### remove

remove a child by reference
 
```javascript
node.remove(child)
```

remove a child at index

```javascript
node.remove(0);
```

In either case the child that is being removed is returned to the caller


## Extending the microdom

Since this is intended as a base level dom implementation, It would be rude if there were no mechanisms for extending it.  The following sections detail how you would go about making microdom work for you.

### Custom Constructors

The biggest issue at this point is handling special case tags as they go through their parse step.  To provide a special object for tags you will want to use the `microdom.tag` function.  It works something like this:

```javascript
function Anchor() {
  this.type = "anchor";
  microdom.MicroNode.apply(this, arguments);
}

inherits(Anchor, microdom.MicroNode);

// add a click method
Anchor.prototype.click = function() {
  console.log('clicked!');
}

// Associate 'a' tags with the Anchor constructort
microdom.tag('a', Anchor);

microdom('<a />').child(0).click(); // outputs 'clicked!'

```

Now whenever the parser sees an `a` as the name of the tag, an `Anchor` will be created instead of the default `MicroNode`

### Custom Functionality

You can extend the prototype of `microdom.MicroNode` at any point and reap the benefits immediately.

Here's an example that will add a `node.getElementsByTagName` function much like the the dom in your browser.

```javascript
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
```

### Keep up with mutation events

Instead of baking all sorts of caching behavior into `microdom`, there is a mutation event interface that
notifies listeners whenever common things happen.

 * add node  - `dom.on('+node', ...)`
 * remove node  - `dom.on('-node', ...)`
 * add attribute  - `dom.on('+attr.<name>, ...)`
 * change attribute - `dom.on('~attr.<name>', ...)`
 * remove attribute - `dom.on('-attr.<name>', ...)`

Please note that mutation events are _only_ emitted from the root node.  The bubble/capture event system should exist in userland.

Here's how you would listen for updates to any `class` attribute in the dom:

```javascript

var dom = microdom();
var node = dom.append('a');

dom.on('~attr.class', function(node, attributeValue) {
  console.log(node.name + "'s class is now", attributeValue);
});

node.attr('class', 'biglink'); // outputs "a's class is now biglink"

``` 

Mutation events are prefixed to separate them from other types of events

 * `~` - change
 * `+` - addition
 * `-` - removal

for more info see the `mutation events` section in `test/test.js`


## Finding plugins

Easy peasy, hit up this url [http://npmsearch.com/?q=keywords:microdom,plugin](http://npmsearch.com/?q=keywords:microdom,plugin)

## License

MIT (see license.txt)
