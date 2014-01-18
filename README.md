## microdom

A tiny dom that is not compliant with the w3c dom specifcation

## Why?

After writing jsdom, some things have been bugging me.

 * how much of the dom do I actually need?
 * why are the methods specified in the dom so obtuse?
 * what if I want to abuse the dom and use it for storage?
 * how do I get the dom to be faster?

I'll attempt to answer these questions with this library.  Sure, it's
non-standard, but in the majority of cases you don't really the java-like rigidity that the dom spec forces you into.

## So how does it work?

It's simple. There is a constructor called `MicroNode` which is going to be the basis of this library.  `MicroDom` extends off of this and acts as nothing more than a node to keep track of where the root of the document is.  Each `MicroNode` has a reference to it's parent and root, and these are mantained for you when you use the management methods specified below.

`MicroNode`s have node idea what a normal html element is and whether or not they are one.  For many cases, it is not important. Especially in an environment where there there is no graphics being displayed or user input.  read: node.js or in a webworker

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

var dom = microdom('<a href="http://tmpvar.com">tmpvar</a>');
console.log(dom.children[0].attr('href')); // http://tmpvar.com

```

That was pretty easy, right? Ok, lets talk about it for a second.  You may have noticed that the `href` attribute has not been messed with.  That is by design!  

Huh?

Well, the idea is that if you need to convert an `href` or do special processing on attributes/nodes, you should probably do that when you need it.  If I tried to handle all of the cases for you, then I'd just be building jsdom again!

Put another way, if you need the `href` of an anchor to resolve based on the `<base>` element of the page or some other logic, write a module that does exactly that.

## Sounds good, what methods can I use?

to create a new dom use the `microdom([xml])` method which may be passed an optional xml string.

### append

create a new node and append it to `node`

```javascript
var anchor = node.append('a', { href : 'http://tmpvar.com' })`
```

append an existing `node` to another's children array

```javascript
node.append(anotherNode);
```

parse and append some xml

```javascript

node.append('<a /><b />');
```

In either case the return value of this function is the node that was
appended

### prepend

works similar to append but instead of putting the incoming node(s) at the end of the children array, it will put it at the beginning

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