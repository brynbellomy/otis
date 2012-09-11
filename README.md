# // otis

## *(the next documentation generator)*

named after the documenter of the dock of some nameless bay somewhere.

**supported languages:**

- javascript
- coffeescript
- objective-c
- c / c++
- c#
- java
- python
- ruby
- gaelic.  i think.

# how sick is this, bro?

*real sick*.  check it:

- **auto-append custom CSS to every single documentation build**  
  never have to waste any suffering on crappy or hyper-corporate color schemes
  again. hell, make your docs look like the dead sea scrolls or something.
  sky's the limit.
- **syntax highlighting:** pygments.
- **templating:**
  [visionmedia/consolidate.js](http://github.com/visionmedia/consolidate.js),
  which means just about every template engine ever is supported.
    - [jade](http://github.com/visionmedia/jade) templates are provided out of
      the box.  that's right.  so sick you just threw up.
- **3 markdown engines** you can choose from:
    - showdown.js
    - [github-flavored-markdown](http://github.com/isaacs/github-flavored-markdown)
    - [marked](https://github.com/chjj/marked)
    - it wouldn't be hard at all to add support for more.  the API is simply a
      synchronous function that takes one argument and returns the rendered markdown.
- **simple project config files**  
  uses node.js's native module `require` architecture to store settings
  per-project for generating documentation.  that way you can just type `otis`
  in the project root -- nothing more.  finally, you'll be able to get that
  frontal lobotomy without inconveniencing your coworkers -- you've earned it!
- **simple global config files**  
  ...in case you know you'll always want this or that flag specified, no matter
  what you're documenting.
- **a cakefile task**  
  because who doesn't love `cake watch`ing?
- **it documents Objective-C code**  
  why?  because that's my godawful day job.  **otis** will also help you document
    1. tearing the wings off of angels, 
    2. grinding little puppies into big mac meat patties
    3. etc.



# requirements

[Pygments (http://pygments.org)](http://pygments.org)



# installation

(this *should* `easy_install` **pygments** for you, but if not, it's not very hard to get it up and running manually)

```sh
npm install -g otis
```



# usage

```sh
$ otis [use <config>] [options] [files to document]
```

when `use <config>` is present, **otis** will attempt to load config files in the
following order:

- ~/.otis/otis.config.js
- ~/.otis/otis.config.\<config\>.js
- ./otis.config.\<config\>.js

... and will bail if neither of the latter two could be found, assuming you
have made a grave error of some kind.  **otis** will not look for
`./otis.config.js` under these circumstances.

when there is no 'use <config>' argument specified, otis will use this order
instead:

- `~/.otis/otis.config.js`
- `./otis.config.js`

## + config files

**otis** loads all of the config files it can find and merges them together,
giving "override precedence" to the files listed closer to the bottom in the
two lists above.

so for example, if you have a home directory **otis.config.js** and also a
current directory **otis.config.js**, otis will load both, and will allow
anything in the current directory config to override the home directory config.

## + input files

they're just your typical input files.  four little NBs, though:

- the list of files is relative to the path you give in the `inDir` argument
  (if you give one).
- any of the files given can also be directories, in which case **otis** will
  recurse into them.
- folder structure inside the input directory is preserved into the output
  directory.
- output file names are simply **\<original filename with ext\>.html**.


## + options (you can put any of these in an otis.config.js file!)

```
  -i, --inDir           Input directory (defaults to current dir)
  -o, --outDir          Output directory (defaults to ./doc)
  -t, --tplDir          Directory containing dox.<ext>, code.<ext>, and tmpl.<ext>
  -e, --tplEngine       Template parser (see github.com/visionmedia/consolidate.js)
  -n, --tplExtension    Template file extension
  -m, --markdownEngine  Only two choices, cowboy.
  -u, --onlyUpdated     Only process files that have been changed
  -c, --colourScheme    Color scheme to use (as in pygmentize -L styles)
  -y, --css             CSS file to include after pygments CSS (you can specify this flag multiple times)
  -T, --tolerant        Will parse comments without a leading ! (ex: "/**! ...")
  -w, --watch           Watch on the input directory for file changes (experimental)
  -I, --ignoreHidden    Ignore hidden files and directories (starting with . or _)
  -s, --sidebarState    Whether the sidebar should be open or not by default
  -x, --exclude         Paths to exclude
  -W, --writeConfig     Write 'otis.config.js' in PWD using the options provided.
  -h, --help            Show this help text.
```



# otis.config.js dissection

you can have **otis** auto-generate a config file for you in the current
directory freezing whatever flags you pass to it into a reusable command.
if the current directory or `~/.otis` contain an `otis.config.js` file, all you
have to type to generate beautiful, easily-navigable documentation is `otis .`
(mind the dot)

but, just for reference's sake, an `otis.config.js` file will basically look
like this:

```js
module.exports = {
  inDir: './',
  outDir: './doc',
  tplDir: require("path").join(process.env.HOME, '.otis', 'templates'),
  tplEngine: 'jade',
  tplExtension: 'jade',
  markdownEngine: 'showdown',
  onlyUpdated: false,
  colorScheme: 'friendly',
  tolerant: false,
  ignoreHidden: true,
  sidebarState: true,
  exclude: 'otis.config.js,*.md,doc,node_modules,bin'
};
```

yep, just a regular old **node.js** module.

**note** that the keys on this object correlate 1 to 1 with the available
command-line options.  that's the plan moving forward indefinitely.



# ~/.otis

there's currently only one file that **otis** is hard-coded to look for in
`~/.otis`, namely, `otis.config.js` (or `otis.config.<config>.js` as the case
may be).

however, it's also a great place to store your custom templates, custom css
files, etc. as well.  only difference is that you have to tell **otis** (yes,
in a config file) that he should look there for them.

don't waste your `~/.otis`.  put it to good use.



# examples

## 1. process every file in the current directory into ./doc

```sh
$ otis .
```

## 2. process files in ./src to ./documents

```sh
$ otis -i src -o documents
```
or:
```sh
$ otis -o documents src
```
or:
```sh
$ otis -o documents src/*
```

note that in the first example, the contents of `src` will be mapped directly
into `documents` whereas in the second and third examples, the files will be
created inside `documents/src`.

## 3. generate otis docs

i will bequeath to you the secret, ancient command i use to generate
[this project's documentation](http://brynbellomy.github.com/otis).  it does
all of the following:

- uses **jade** as the templating engine
- uses custom **jade** templates sitting in my home directory instead of
  something ugly and hardcoded like with most doc tools
- uses the "friendly" color scheme from pygments
- modifies the "friendly" color scheme with custom CSS
- outputs to a directory on the `gh-pages` branch of this repo
- ignores files starting with `_` or `.`
- excludes the `node_modules` directory, the `README.md` file, and a few other
  things
- ignores comment blocks that don't begin with a "!"

the command is:

```sh
$ otis .
```

hahaaaaa, gotcha!  see?  use **otis.config.js** files.  they're great.


# addendum

## + strict-mode and tolerant-mode

you may not want every single comment in your code to end up as a line in your
documentation.  **otis** assumes that to be the case by default and will only
process a comment as documentation if the very first character after the
comment delimiter is `!` (an exclamation point).

so, depending on the language, something like the following:

```c++
//! slkdfjslkdjf
```

```c++
/*!
 * alskdfjlaskjdf
 */
```

```coffeescript
###!
asldkfjalskdjf
###
```

**if you want to disable this behavior so that all comments become
documentation,** just use the `--tolerant` or `-T` flag on the command line, or
include `tolerant: true` in your `otis.config.js` file.



## + color schemes

these are exactly as in `pygmentize -L styles`:

- monokai
- manni
- rrt
- perldoc
- borland
- colorful
- default
- murphy
- vs
- trac
- tango
- fruity
- autumn
- bw
- emacs
- vim
- pastie
- friendly
- native



# authors / contributors

**at the moment, only:**

bryn austin bellomy < [bryn.bellomy@gmail.com](mailto:bryn.bellomy@gmail.com) >


# forefathers / ancestors

**otis owes unrepayable debts to:**

- [jashkenas / **docco**](http://jashkenas.github.com/docco/)
- [mbrevoort / **docco-husky**](https://github.com/mbrevoort/docco-husky)
- [jbt / **docker**](http://jbt.github.com/docker)



# license (wtfpl)

```
DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
Version 2, December 2004

Copyright (C) 2004 Sam Hocevar <[sam@hocevar.net](mailto:sam@hocevar.net)>

Everyone is permitted to copy and distribute verbatim or modified 
copies of this license document, and changing it is allowed as long 
as the name is changed. 

DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

0. You just DO WHAT THE FUCK YOU WANT TO. 
```
