# // doc-tracy

terrible name, great documentation.

supported languages: ostensibly, uh... javascript, coffeescript, c, c++, objective-c, java,
and gaelic.  i think.

# how sick is this, bro?

*real sick*.  check it:

- **syntax highlighting:** pygments.
- **templating:** [visionmedia/consolidate.js](http://github.com/visionmedia/consolidate.js),
  which means just about every template engine ever is supported.
	- [jade](http://github.com/visionmedia/jade) templates are provided out of the box.  that's
	  right.  so sick you just threw up.
- **markdown engine:** either [github-flavored-markdown](http://github.com/isaacs/github-flavored-markdown)
  or [marked](https://github.com/chjj/marked).
- **per-project config flat files:** uses node.js's native module `require` architecture to store
  settings per-project for generating documentation.  that way you can just type `docker` in the
  project root -- nothing more.  finally, you'll be able to get that frontal lobotomy without
  inconveniencing your coworkers -- you've earned it!
- **a cakefile task:** i figured it would be charitable to help the feeble.  `cake doc` all day,
  worm.
- **it documents Objective-C code:** why?  because i hate you.  sigh, kidding ... -- why?  because
  that's my godawful day job.  **doc-tracy** will also help you document 1) tearing the wings off
  of angels, 2) grinding little puppies into big mac meat patties, etc.






# everything below this line is definitely mad outdated ---->

A documentation generator built on the foundations of [Docco](http://jashkenas.github.com/docco/) and [Docco-Husky](https://github.com/mbrevoort/docco-husky).

The support available in Docco and Docco-Husky for larger projects consisting of many hundreds of script files was somewhat lacking, so I decided to create my own.

Take a look at this project's [public page](http://jbt.github.com/docker) for an example of what it can do.

## Installation

Simple: `npm install -g docker`

Requires [Pygments](http://pygments.org/)

## Usage

```sh
$ docker [options] [files ...]
```

Available options are:

 * `-i` or `--input_dir`: Path to input source directory. Defaults to current directory.
 * `-o` or `--output_dir`: Path to output doc directory. Defaults to `./doc`.
 * `-u` or `--updated_files`: If present, only process files that hav been changed.
 * `-c` or `--colour_scheme` (yes, I'm British): Colour scheme to use. Colour schemes are as below.
 * `-I` or `--ignore_hidden`: Ignore files and directories whose names begin with `.` or `_`.
 * `-w` or `--watch`: Keep the process running, watch for changes on the directory, and process updated files.
 * `-s` or `--sidebar`: Whether or not the sidebar should be opened by default in the output (defaults to yes, can be yes, no, true, false)
 * `-x` or `--exclude`: Comma-separated list of paths to exclude. Supports basic `*` wildcards too.

If no file list is given, docker will run recursively on every file in the current directory

Any of the files given can also be directories, in which case it will recurse into them.

Folder structure inside the input directory is preserved into the output directory and file names are simply appended `.html` for the doc file

## Examples

If you haven't installed with `-g` specified, replace `docker` with something like `$(npm root)/docker/docker` in all of the examples below.

### Process every file in the current directory into "doc"

```sh
$ docker
```

### Process files in "src" to "documents"

```sh
$ docker -i src -o documents
```
or:
```sh
$ docker -o documents src
```
or:
```sh
$ docker -o documents src/*
```

Note that in the first example, the contents of `src` will be mapped directly into `documents` whereas in the second and third
examples, the files will be created inside `documents/src`

### Generate Docker docs

This is the command I use to generate [this project's documentation](http://jbt.github.com/docker).

 * Output to a directory on the `gh-pages` branch of this repo
 * Use the "manni" colour scheme
 * Ignore files starting with `_` or `.`
 * Only process updated files
 * Exclude the node_modules directory
 * Watch the directory for further changes as the code is updated.

```sh
$ docker -o ../docker_gh-pages -c manni -I -u -x node_modules --watch
```


## Colour Schemes

These are exactly as in `pygmentize -L styles`:

 * monokai
 * manni
 * rrt
 * perldoc
 * borland
 * colorful
 * default
 * murphy
 * vs
 * trac
 * tango
 * fruity
 * autumn
 * bw
 * emacs
 * vim
 * pastie
 * friendly
 * native


## Important note

All files must be inside the input directory (specified by `-i`) or one of its descendant subdirectories. If they're not then it'll just get horribly confused and get into an infinite loop. Which isn't nice.