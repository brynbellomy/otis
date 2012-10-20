/*!
# otis.js

A highly customizable, extremely simple documentation generator based on

- [jashkenas / **docco**](http://jashkenas.github.com/docco/)
- [mbrevoort / **docco-husky**](https://github.com/mbrevoort/docco-husky)
- [jbt / **docker**](http://jbt.github.com/docker)

__otis__ was once a really simple documentation generator -- **docker**.  **docker** originally
started out as a pure-javascript port of **docco**, but eventually gained many extra little features
that somewhat break docco's philosophy of being a quick-and-dirty thing.

__docker__ was based on **docco**'s coffeescript source, but converted to javascript.

__otis__ is based on **docker**, but has been re-converted to coffeescript.

especially given that some of the conversion was made using the fantastic (but not infallible)
(http://js2coffee.org), you might notice some strange code artifacts here and there -- javascript-isms
converted into coffeescript, and coffeescript-isms converted *through* javascript back into itself.

otis source code can be found on GitHub at [brynbellomy / otis](https://github.com/brynbellomy/otis)

By the way, this page is the result of running otis against itself (with some additional custom CSS appended).
*/

var consolidate, dox, exec, fs, mkdirp, path, spawn, watchr, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require("fs");

dox = require("dox");

path = require("path");

_ref = require("child_process"), exec = _ref.exec, spawn = _ref.spawn;

watchr = require("watchr");

mkdirp = require("mkdirp");

consolidate = require("consolidate");

exports.Otis = (function() {
  /*!
  ## Otis()
  
  Creates a new otis instance. All methods are called on one instance of this object.
  
  Input arguments are an object containing any of the keys
  
  - `inDir`
  - `outDir`
  - `tplDir`,
  - `tplEngine`
  - `tplExtension`
  - `markdownEngine`
  - `colorScheme`
  - `css`
  - `index`
  - `tolerant`
  - `onlyUpdated`
  - `ignoreHidden`
  - `sidebarState`
  - `exclude`
  
  @constructor
  @param {object} opts
  */

  function Otis(opts) {
    this.compileTemplate = __bind(this.compileTemplate, this);

    this.render = __bind(this.render, this);

    this.outFile = __bind(this.outFile, this);

    this.copySharedResources = __bind(this.copySharedResources, this);

    this.renderMarkdownHtml = __bind(this.renderMarkdownHtml, this);

    this.renderCodeHtml = __bind(this.renderCodeHtml, this);

    this.addAnchors = __bind(this.addAnchors, this);

    this.highlighExtractedCode = __bind(this.highlighExtractedCode, this);

    this.extractDocCode = __bind(this.extractDocCode, this);

    this.processDocCodeBlocks = __bind(this.processDocCodeBlocks, this);

    this.highlight = __bind(this.highlight, this);

    this.pygments = __bind(this.pygments, this);

    this.languageParams = __bind(this.languageParams, this);

    this.parseSections = __bind(this.parseSections, this);

    this.fileIsNewer = __bind(this.fileIsNewer, this);

    this.decideWhetherToProcess = __bind(this.decideWhetherToProcess, this);

    this.generateDoc = __bind(this.generateDoc, this);

    this.processNextFile = __bind(this.processNextFile, this);

    this.addFileToTree = __bind(this.addFileToTree, this);

    this.queueFile = __bind(this.queueFile, this);

    this.addNextFile = __bind(this.addNextFile, this);

    this.clean = __bind(this.clean, this);

    this.finished = __bind(this.finished, this);

    this.watch = __bind(this.watch, this);

    this.doc = __bind(this.doc, this);

    this.parseOpts = __bind(this.parseOpts, this);
    this.parseOpts(opts);
    this.running = false;
    this.scanQueue = [];
    this.files = [];
    this.tree = {};
  }

  Otis.prototype.parseOpts = function(opts) {
    var defaults, i, _fn,
      _this = this;
    defaults = {
      inDir: path.resolve("."),
      outDir: path.resolve("doc"),
      tplDir: path.join(path.resolve(__dirname), "res"),
      tplEngine: "internal",
      tplExtension: "jst",
      markdownEngine: "marked",
      colourScheme: "default",
      css: [],
      index: null,
      tolerant: false,
      onlyUpdated: false,
      ignoreHidden: false,
      sidebarState: true,
      exclude: false
    };
    _fn = function(i) {
      if (defaults.hasOwnProperty(i) && typeof opts[i] === "undefined") {
        return opts[i] = defaults[i];
      }
    };
    for (i in defaults) {
      _fn(i);
    }
    this.inDir = opts.inDir.replace(/\/$/, "");
    this.outDir = opts.outDir;
    this.tplDir = opts.tplDir;
    this.tplEngine = opts.tplEngine;
    this.tplExtension = opts.tplExtension;
    this.markdownEngine = opts.markdownEngine;
    this.onlyUpdated = !!opts.onlyUpdated;
    this.colourScheme = opts.colourScheme;
    this.css = opts.css;
    this.index = opts.index;
    this.tolerant = !!opts.tolerant;
    this.ignoreHidden = !!opts.ignoreHidden;
    this.sidebarState = opts.sidebarState;
    if (typeof opts.exclude === "string") {
      this.excludePattern = new RegExp("^(" + opts.exclude.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/,/g, "|") + ")(/|$)");
    } else {
      this.excludePattern = false;
    }
    if (opts.colorScheme != null) {
      opts.colourScheme = opts.colorScheme;
    }
    return this._renderMarkdown = function(text, cb) {
      var fn;
      fn = null;
      switch (_this.markdownEngine) {
        case "gfm":
          fn = require("github-flavored-markdown").parse;
          break;
        case "showdown":
          fn = require("" + __dirname + "/../res/showdown").Showdown.makeHtml;
          break;
        case "marked":
          fn = require("marked");
          fn.setOptions({
            gfm: false,
            pedantic: false,
            sanitize: false
          });
          break;
        default:
          fn = function(data) {
            return data;
          };
      }
      return fn(text);
    };
  };

  /*!
  ## doc
  
  Generates documentation for specified files.
  
  @param {Array} files Array of file paths relative to the `inDir` to generate documentation for.
  */


  Otis.prototype.doc = function(files) {
    this.running = true;
    [].push.apply(this.scanQueue, files);
    return this.addNextFile();
  };

  /*!
  ## watch
  
  Watches the input directory for file changes and updates docs whenever a file is updated
  
  @param {Array} files Array of file paths relative to the `inDir` to generate documentation for.
  */


  Otis.prototype.watch = function(files) {
    var self, update, uto;
    this.watching = true;
    this.watchFiles = files;
    uto = false;
    self = this;
    update = function() {
      if (self.running) {
        return (uto = setTimeout(update, 250));
      }
      self.clean();
      self.doc(self.watchFiles);
      return uto = false;
    };
    watchr.watch(this.inDir, (function() {
      if (!uto) {
        return uto = setTimeout(update, 250);
      }
    }), null);
    return this.doc(files);
  };

  /*!
  ## finished
  
  Callback function fired when processing is finished.
  */


  Otis.prototype.finished = function(err) {
    if (err) {
      console.error(err.toString().red);
    }
    this.running = false;
    if (this.watching) {
      this.onlyUpdated = true;
      return console.log("Done. Waiting for changes...");
    } else {
      return console.log("Done.");
    }
  };

  /*!
  ## clean
  
  Clears out any instance variables so this otis can be rerun
  */


  Otis.prototype.clean = function() {
    this.scanQueue = [];
    this.files = [];
    return this.tree = {};
  };

  /*!
  ## addNextFile
  
  Process the next file on the scan queue. If it's a directory, list all the children and queue those.
  If it's a file, add it to the queue.
  */


  Otis.prototype.addNextFile = function() {
    var cb, currFile, filename, self;
    self = this;
    if (this.scanQueue.length > 0) {
      filename = this.scanQueue.shift();
      if (this.excludePattern && this.excludePattern.test(filename)) {
        return this.addNextFile();
      }
      currFile = path.resolve(this.inDir, filename);
      cb = function(err, stat) {
        if (stat != null ? stat.isSymbolicLink() : void 0) {
          return fs.readlink(currFile, function(err, link) {
            currFile = path.resolve(path.dirname(currFile), link);
            return fs.exists(currFile, function(exists) {
              if (!exists) {
                console.error("Unable to follow symlink to " + currFile + ": file does not exist");
                return self.addNextFile();
              } else {
                return fs.lstat(currFile, cb);
              }
            });
          });
        } else if (stat != null ? stat.isDirectory() : void 0) {
          return fs.readdir(path.resolve(self.inDir, filename), function(err, list) {
            var maybe, _i, _len;
            for (_i = 0, _len = list.length; _i < _len; _i++) {
              maybe = list[_i];
              if (self.ignoreHidden && maybe.charAt(0).match(/[\._]/)) {
                continue;
              }
              self.scanQueue.push(path.join(filename, maybe));
            }
            return self.addNextFile();
          });
        } else {
          self.queueFile(filename);
          return self.addNextFile();
        }
      };
      return fs.lstat(currFile, cb);
    } else {
      return this.processNextFile();
    }
  };

  /*!
  ## queueFile
  
  Queues a file for processing, and additionally stores it in the folder tree
  
  @param {string} filename Name of the file to queue
  */


  Otis.prototype.queueFile = function(filename) {
    return this.files.push(filename);
  };

  /*!
  ## addFileToTree
  
  Adds a file to the file tree to show in the sidebar. This used to be in `queueFile` but
  since we're now only deciding whether or not the file can be included at the point of
  reading it, this has to happen later.
  
  @param {string} filename Name of file to add to the tree
  */


  Otis.prototype.addFileToTree = function(filename) {
    var bits, currDir, i, pathSeparator;
    pathSeparator = path.join("a", "b").replace(/(^.*a|b.*$)/g, "");
    filename = filename.replace(new RegExp("^" + pathSeparator.replace(/([\/\\])/g, "\\$1")), "");
    bits = filename.split(pathSeparator);
    currDir = this.tree;
    i = 0;
    while (i < bits.length - 1) {
      if (!currDir.dirs) {
        currDir.dirs = {};
      }
      if (!currDir.dirs[bits[i]]) {
        currDir.dirs[bits[i]] = {};
      }
      currDir = currDir.dirs[bits[i]];
      i += 1;
    }
    if (!currDir.files) {
      currDir.files = [];
    }
    return currDir.files.push(bits[bits.length - 1]);
  };

  /*!
  ## processNextFile
  
  Take the next file off the queue and process it
  */


  Otis.prototype.processNextFile = function() {
    var _this = this;
    if (this.files.length > 0) {
      return this.generateDoc(this.files.shift(), function() {
        return _this.processNextFile();
      });
    } else {
      return this.copySharedResources();
    }
  };

  /*!
  ## generateDoc
  
  _This is where the magic happens_
  
  Generate the documentation for a file
  
  @param {string} filename File name to generate documentation for
  @param {function} cb Callback function to execute when we're done
  */


  Otis.prototype.generateDoc = function(infilename, cb) {
    var filename,
      _this = this;
    this.running = true;
    filename = path.resolve(this.inDir, infilename);
    return this.decideWhetherToProcess(filename, function(shouldProcess) {
      if (!shouldProcess) {
        return cb();
      }
      return fs.readFile(filename, "utf-8", function(err, data) {
        var lang, sections;
        if (err) {
          throw err;
        }
        lang = _this.languageParams(filename, data);
        if (lang === false) {
          return cb();
        }
        _this.addFileToTree(infilename);
        switch (_this.languages[lang].type) {
          case "markdown":
            return _this.renderMarkdownHtml(data, filename, cb);
          case "code":
            break;
          default:
            sections = _this.parseSections(data, lang);
            return _this.highlight(sections, lang, function() {
              return _this.renderCodeHtml(sections, filename, cb);
            });
        }
      });
    });
  };

  /*!
  ## decideWhetherToProcess
  
  Decide whether or not a file should be processed. If the `onlyUpdated`
  flag was set on initialization, only allow processing of files that
  are newer than their counterpart generated doc file.
  
  Fires a callback function with either true or false depending on whether
  or not the file should be processed
  
  @param {string} filename The name of the file to check
  @param {function} callback Callback function
  */


  Otis.prototype.decideWhetherToProcess = function(filename, callback) {
    var outFile;
    if (!this.onlyUpdated) {
      return callback(true);
    }
    outFile = this.outFile(filename);
    return this.fileIsNewer(filename, outFile, callback);
  };

  /*!
  ## fileIsNewer
  
  Sees whether one file is newer than another
  
  @param {string} file File to check
  @param {string} otherFile File to compare to
  @param {function} callback Callback to fire with true if file is newer than otherFile
  */


  Otis.prototype.fileIsNewer = function(file, otherFile, callback) {
    return fs.stat(otherFile, function(err, outStat) {
      if (err && err.code === "ENOENT") {
        return callback(true);
      }
      return fs.stat(file, function(err, inStat) {
        return callback(+inStat.mtime > +outStat.mtime);
      });
    });
  };

  /*!
  ## parseSections
  
  Parse the content of a file into individual sections.
  A section is defined to be one block of code with an accompanying comment
  
  Returns an array of section objects, which take the form
  ```js
  {
  doc_text: 'foo', // String containing comment content
  code_text: 'bar' // Accompanying code
  }
  ```
  @param {string} data The contents of the script file
  @param {string} language The language of the script file
  
  @return {Array} array of section objects
  */


  Otis.prototype.parseSections = function(data, language) {
    var async, codeLines, commentRegex, doxData, inMultiLineComment, md, multiLine, numSpacesIndent, params, section, sections,
      _this = this;
    md = function(a, stripParas) {
      var h;
      h = _this._renderMarkdown(a.replace(/(^\s*|\s*$)/, ""));
      return (stripParas ? h.replace(/<\/?p>/g, "") : h);
    };
    codeLines = data.split("\n");
    sections = [];
    params = this.languages[language];
    section = {
      docs: "",
      code: ""
    };
    inMultiLineComment = false;
    numSpacesIndent = 0;
    multiLine = "";
    doxData = void 0;
    commentRegex = new RegExp("^\\s*" + params.comment + "\\s?");
    async = require("async");
    async.forEachSeries(codeLines, function(line, forEachCb) {
      var match, matchable;
      matchable = line.replace(/(["'])(?:\\.|(?!\1).)*\1/g, "");
      if (params.multiLine) {
        if (inMultiLineComment) {
          if (line.match(params.multiLine[1])) {
            inMultiLineComment = false;
            if (params.dox) {
              multiLine += line;
              try {
                multiLine = multiLine.replace(params.multiLine[0], "").replace(params.multiLine[1], "");
                if (multiLine.charAt(0) === "!") {
                  multiLine = multiLine.slice(1);
                }
                multiLine = ("/**" + multiLine + "*/").split('\n').map(function(line) {
                  return line.replace(new RegExp("^ {" + numSpacesIndent + "}"), '');
                }).join('\n');
                doxData = dox.parseComments(multiLine, {
                  raw: true
                })[0];
                doxData.md = md;
                return _this.render("dox", doxData, function(err, rendered) {
                  if (err) {
                    throw err;
                  }
                  section.docs += rendered;
                  return forEachCb();
                });
              } catch (e) {
                console.error("Dox error: " + e);
                multiLine += line.replace(params.multiLine[1], "") + "\n";
                section.docs += "\n" + multiLine.replace(params.multiLine[0], "") + "\n";
              }
            } else {
              multiLine += line.replace(params.multiLine[1], "") + "\n";
              section.docs += "\n" + multiLine.replace(params.multiLine[0], "") + "\n";
            }
            multiLine = "";
          } else {
            multiLine += line + "\n";
          }
          return forEachCb();
        } else if ((_this.tolerant === true || matchable.replace(/\s*/, "").replace(params.multiLine[0], "").charAt(0) === "!") && matchable.match(params.multiLine[0]) && !matchable.replace(params.multiLine[0], "").match(params.multiLine[1]) && !matchable.split(params.multiLine[0])[0].match(commentRegex)) {
          if (section.code) {
            if (!section.code.match(/^\s*$/) || !section.docs.match(/^\s*$/)) {
              sections.push(section);
            }
            section = {
              docs: "",
              code: ""
            };
          }
          match = matchable.match(params.multiLine[0]);
          if (match[1]) {
            numSpacesIndent = match[1].length;
          }
          inMultiLineComment = true;
          multiLine = line + "\n";
          return forEachCb();
        }
      }
      if (matchable.match(commentRegex) && (!params.commentsIgnore || !matchable.match(params.commentsIgnore)) && !matchable.match(/#!/) && (_this.tolerant === true || matchable.replace(commentRegex, "").charAt(0) === "!")) {
        if (section.code) {
          if (!section.code.match(/^\s*$/) || !section.docs.match(/^\s*$/)) {
            sections.push(section);
          }
          section = {
            docs: "",
            code: ""
          };
        }
        line = line.replace(commentRegex, "");
        if (line.charAt(0) === "!") {
          line = line.slice(1);
        }
        section.docs += line + "\n";
      } else {
        if (!params.commentsIgnore || !line.match(params.commentsIgnore)) {
          section.code += line + "\n";
        }
      }
      return forEachCb();
    });
    sections.push(section);
    return sections;
  };

  /*!
  ## languageParams
  
  Provides language-specific params for a given file name.
  
  @param {string} filename The name of the file to test
  @param {string} filedata The contents of the file (to check for shebang)
  @return {object} Object containing all of the language-specific params
  */


  Otis.prototype.languageParams = function(filename, filedata) {
    var ext, i, j, match, shebangRegex;
    ext = path.extname(filename);
    ext = ext.replace(/^\./, "");
    if (ext === ".C") {
      return "cpp";
    }
    ext = ext.toLowerCase();
    for (i in this.languages) {
      if (!this.languages.hasOwnProperty(i)) {
        continue;
      }
      if (this.languages[i].extensions.indexOf(ext) !== -1) {
        return i;
      }
    }
    shebangRegex = /^\n*#!\s*(?:\/usr\/bin\/env)?\s*(?:[^\n]*\/)*([^\/\n]+)(?:\n|$)/;
    match = shebangRegex.exec(filedata);
    if (match) {
      for (j in this.languages) {
        if (!this.languages.hasOwnProperty(j)) {
          continue;
        }
        if (this.languages[j].executables && this.languages[j].executables.indexOf(match[1]) !== -1) {
          return j;
        }
      }
    }
    return false;
  };

  /*!
  The language params can have the following keys:
  
  + `name`: Name of Pygments lexer to use
  + `comment`: String flag for single-line comments
  + `multiline`: Two-element array of start and end flags for block comments
  + `commentsIgnore`: Regex of comments to strip completely (don't even doc)
  + `dox`: Whether to run block comments through Dox
  + `type`: Either `'code'` (default) or `'markdown'` - format of page to render
  */


  Otis.prototype.languages = {
    javascript: {
      extensions: ["js"],
      executables: ["node"],
      comment: "//",
      multiLine: [/\/\*\*?/, /\*\//],
      commentsIgnore: /^\s*\/\/=/,
      dox: true
    },
    coffeescript: {
      extensions: ["coffee"],
      executables: ["coffee"],
      comment: "#",
      multiLine: [/^(\s*)###/, /###\s*$/],
      dox: true
    },
    ruby: {
      extensions: ["rb"],
      executables: ["ruby"],
      comment: "#",
      multiLine: [/\=begin/, /\=end/]
    },
    python: {
      extensions: ["py"],
      executables: ["python"],
      comment: "#"
    },
    perl: {
      extensions: ["pl", "pm"],
      executables: ["perl"],
      comment: "#"
    },
    c: {
      extensions: ["c"],
      executables: ["gcc"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//]
    },
    objc: {
      extensions: ["m", "h"],
      executables: ["clang", "gcc"],
      dox: true,
      comment: "//",
      multiLine: [/\/\*\*?/, /\*\//]
    },
    cpp: {
      extensions: ["cc", "cpp"],
      executables: ["g++"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//]
    },
    csharp: {
      extensions: ["cs"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//]
    },
    java: {
      extensions: ["java"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//],
      dox: true
    },
    php: {
      extensions: ["php", "php3", "php4", "php5"],
      executables: ["php"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//],
      dox: true
    },
    actionscript: {
      extensions: ["as"],
      comment: "//",
      multiLine: [/\/\*/, /\*\//]
    },
    sh: {
      extensions: ["sh"],
      executables: ["bash", "sh", "zsh"],
      comment: "#"
    },
    yaml: {
      extensions: ["yaml", "yml"],
      comment: "#"
    },
    markdown: {
      extensions: ["md", "mkd", "markdown"],
      type: "markdown"
    }
  };

  /*!
  ## pygments
  
  Runs a given block of code through pygments
  
  @param {string} data The code to give to Pygments
  @param {string} language The name of the Pygments lexer to use
  @param {function} cb Callback to fire with Pygments output
  */


  Otis.prototype.pygments = function(data, language, cb) {
    var out, pyg, pygArgs;
    pygArgs = ["-g"];
    if (language) {
      pygArgs = ["-l", language];
    }
    pyg = spawn("pygmentize", pygArgs.concat(["-f", "html", "-O", "encoding=utf-8,tabsize=2"]));
    pyg.stderr.on("data", function(err) {
      return console.error(err.toString());
    });
    pyg.stdin.on("error", function(err) {
      console.error("Unable to write to Pygments stdin: ", err);
      return process.exit(1);
    });
    out = "";
    pyg.stdout.on("data", function(data) {
      return out += data.toString();
    });
    pyg.on("exit", function() {
      return cb(out);
    });
    if (pyg.stdin.writable) {
      pyg.stdin.write(data);
      return pyg.stdin.end();
    }
  };

  /*!
  ## highlight
  
  Highlights all the sections of a file using **pygments**
  Given an array of section objects, loop through them, and for each
  section generate pretty html for the comments and the code, and put them in
  `docHtml` and `codeHtml` respectively
  
  @param {Array} sections Array of section objects
  @param {string} language Language ith which to highlight the file
  @param {function} cb Callback function to fire when we're done
  */


  Otis.prototype.highlight = function(sections, language, cb) {
    var i, input, params,
      _this = this;
    params = this.languages[language];
    input = [];
    i = 0;
    while (i < sections.length) {
      input.push(sections[i].code);
      i += 1;
    }
    input = input.join("\n" + params.comment + "----{DIVIDER_THING}----\n");
    return this.pygments(input, language, function(out) {
      var bits, i, section, _i, _len;
      out = out.replace(/^\s*<div class="highlight"><pre>/, "").replace(/<\/pre><\/div>\s*$/, "");
      bits = out.split(new RegExp("\\n*<span class=\"c[1p]?\">" + params.comment + "----\\{DIVIDER_THING\\}----<\\/span>\\n*"));
      i = 0;
      for (i = _i = 0, _len = sections.length; _i < _len; i = ++_i) {
        section = sections[i];
        section.codeHtml = "<div class=\"highlight\"><pre>" + bits[i] + "</pre></div>";
        section.docHtml = _this._renderMarkdown(section.docs);
        i += 1;
      }
      return _this.processDocCodeBlocks(sections, cb);
    });
  };

  /*!
  ## processDocCodeBlocks
  
  Goes through all the HTML generated from comments, finds any code blocks
  and highlights them
  
  @param {Array} sections Sections array as above
  @param {function} cb Callback to fire when done
  */


  Otis.prototype.processDocCodeBlocks = function(sections, cb) {
    var i, next, self;
    self = this;
    i = 0;
    next = function() {
      if (i === sections.length) {
        return cb();
      }
      return self.extractDocCode(sections[i].docHtml, function(html) {
        sections[i].docHtml = html;
        i = i + 1;
        return next();
      });
    };
    return next();
  };

  /*!
  ## extractDocCode
  
  Extract and highlight code blocks in formatted HTML output from showdown
  
  @param {string} html The HTML to process
  @param {function} cb Callback function to fire when done
  */


  Otis.prototype.extractDocCode = function(html, cb) {
    var codeBlocks;
    codeBlocks = [];
    html = html.replace(/<pre><code(\slanguage='([a-z]*)')?>([^<]*)<\/code><\/pre>/g, function(wholeMatch, langBlock, language, block) {
      if (langBlock === "" || language === "") {
        return "<div class='highlight'>" + wholeMatch + "</div>";
      }
      block = block.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/, "&");
      return "\n\n~C" + codeBlocks.push({
        language: language,
        code: block,
        i: codeBlocks.length + 1
      }) + "C\n\n";
    });
    return this.highlighExtractedCode(html, codeBlocks, cb);
  };

  /*!
  ## highlightExtractedCode
  
  Loops through all extracted code blocks and feeds them through pygments
  for code highlighting. Unfortunately the only way to do this that's able
  to cater for all situations is to spawn a new pygments process for each
  code block (as different blocks might be in different languages). If anyone
  knows of a more efficient way of doing this, please let me know.
  
  @param {string} html The HTML the code has been extracted from
  @param {Array} codeBlocks Array of extracted code blocks as above
  @param {function} cb Callback to fire when we're done with processed HTML
  */


  Otis.prototype.highlighExtractedCode = function(html, codeBlocks, cb) {
    var next, self;
    self = this;
    next = function() {
      var nextBlock;
      if (codeBlocks.length === 0) {
        return cb(html);
      }
      nextBlock = codeBlocks.shift();
      return self.pygments(nextBlock.code, nextBlock.language, function(out) {
        out = out.replace(/<pre>/, "<pre><code>").replace(/<\/pre>/, "</code></pre>");
        html = html.replace("\n~C" + nextBlock.i + "C\n", out);
        return next();
      });
    };
    return next();
  };

  /*!
  ## addAnchors
  
  Automatically assign an id to each section based on any headings.
  
  @param {object} section The section object to look at
  @param {number} idx The index of the section in the whole array.
  */


  Otis.prototype.addAnchors = function(docHtml, idx, headings) {
    if (docHtml.match(/<h[0-9]>/)) {
      docHtml = docHtml.replace(/(<h([0-9])>)(.*)(<\/h\2>)/g, function(a, start, level, middle, end) {
        var id;
        id = middle.replace(/<[^>]*>/g, "").toLowerCase().replace(/[^a-zA-Z0-9\_\.]/g, "-");
        headings.push({
          id: id,
          text: middle.replace(/<[^>]*>/g, ""),
          level: level
        });
        return "\n<div class=\"pilwrap\" id=\"" + id + "\">\n  " + start + "\n    <a href=\"#" + id + "\" class=\"pilcrow\">&#182;</a>\n    " + middle + "\n  " + end + "\n</div>\n";
      });
    } else {
      docHtml = "\n<div class=\"pilwrap\">" + "\n  <a class=\"pilcrow\" href=\"#section-" + (idx + 1) + "\" id=\"section-" + (idx + 1) + "\">&#182;</a>" + "\n</div>\n" + docHtml;
    }
    return docHtml;
  };

  /*!
  ## renderCodeHtml
  
  Given an array of sections, render them all out to a nice HTML file
  
  @param {Array} sections Array of sections containing parsed data
  @param {string} filename Name of the file being processed
  @param {function} cb Callback function to fire when we're done
  */


  Otis.prototype.renderCodeHtml = function(sections, filename, cb) {
    var headings, i, levels, outDir, outFile, pathSeparator, relDir, relativeOut, section, self, _i, _len,
      _this = this;
    self = this;
    outFile = this.outFile(filename);
    headings = [];
    outDir = path.dirname(outFile);
    pathSeparator = path.join("a", "b").replace(/(^.*a|b.*$)/g, "");
    relativeOut = path.resolve(outDir).replace(path.resolve(this.outDir), "").replace(/^[\/\\]/, "");
    levels = (relativeOut === "" ? 0 : relativeOut.split(pathSeparator).length);
    relDir = Array(levels + 1).join("../");
    i = 0;
    for (_i = 0, _len = sections.length; _i < _len; _i++) {
      section = sections[_i];
      section.docHtml = this.addAnchors(section.docHtml, i, headings);
      i++;
    }
    return this.render("code", {
      title: path.basename(filename),
      sections: sections
    }, function(err, renderedCode) {
      var locals;
      if (err) {
        throw err;
      }
      locals = {
        title: path.basename(filename),
        relativeDir: relDir,
        content: renderedCode,
        headings: headings,
        sidebar: _this.sidebarState,
        colourScheme: _this.colourScheme,
        filename: filename.replace(_this.inDir, "").replace(/^[\/\\]/, "")
      };
      return _this.render("tmpl", locals, function(err, rendered) {
        if (err) {
          throw err;
        }
        return _this.writeFile(outFile, rendered, "Generated: " + (outFile.replace(_this.outDir, '')), cb);
      });
    });
  };

  /*!
  ## renderMarkdownHtml
  
  Renders the output for a Markdown file into HTML
  
  @param {string} content The markdown file content
  @param {string} filename Name of the file being processed
  @param {function} cb Callback function to fire when we're done
  */


  Otis.prototype.renderMarkdownHtml = function(content, filename, cb) {
    var _this = this;
    content = this._renderMarkdown(content);
    return this.extractDocCode(content, function(content) {
      var headings, levels, locals, outDir, outFile, pathSeparator, relDir, relativeOut;
      headings = [];
      content = "<div class=\"docs markdown\">" + (_this.addAnchors(content, 0, headings)) + "</div>";
      outFile = _this.outFile(filename);
      outDir = path.dirname(outFile);
      pathSeparator = path.join("a", "b").replace(/(^.*a|b.*$)/g, "");
      relativeOut = path.resolve(outDir).replace(path.resolve(_this.outDir), "").replace(/^[\/\\]/, "");
      levels = (relativeOut === "" ? 0 : relativeOut.split(pathSeparator).length);
      relDir = Array(levels + 1).join("../");
      locals = {
        title: path.basename(filename),
        relativeDir: relDir,
        content: content,
        headings: headings,
        colourScheme: _this.colourScheme,
        sidebar: _this.sidebarState,
        filename: filename.replace(_this.inDir, "").replace(/^[\\\/]/, "")
      };
      return _this.render("tmpl", locals, function(err, rendered) {
        return _this.writeFile(outFile, rendered, "Generated: " + outFile.replace(_this.outDir, ""), cb);
      });
    });
  };

  /*!
  ## copySharedResources
  
  Copies the shared CSS and JS files to the output directories
  */


  Otis.prototype.copySharedResources = function() {
    var async, inPath_colorSchemeCSS, inPath_scriptJS, log, outPath_CSS, outPath_docScriptJS, outPath_filelistJS, outPath_indexHTML,
      _this = this;
    inPath_scriptJS = path.join(path.dirname(__filename), "..", "res", "script.js");
    inPath_colorSchemeCSS = path.join(path.dirname(__filename), "..", "res", "css", "" + this.colourScheme + ".css");
    outPath_docScriptJS = path.join(this.outDir, "doc-script.js");
    outPath_filelistJS = path.join(this.outDir, "doc-filelist.js");
    outPath_CSS = path.join(this.outDir, "doc-style.css");
    outPath_indexHTML = path.join(this.outDir, "index.html");
    log = function(msg, cb) {
      console.log(msg);
      return cb(null);
    };
    async = require("async");
    return async.auto({
      readScriptJS: function(cb, results) {
        return fs.readFile(inPath_scriptJS, cb);
      },
      readColorschemeCSS: function(cb, results) {
        return fs.readFile(inPath_colorSchemeCSS, cb);
      },
      genPygmentsCSS: function(cb, results) {
        return exec("pygmentize -S " + _this.colourScheme + " -f html -a 'body .highlight'", function(code, stdout, stderr) {
          return cb(stderr, stdout);
        });
      },
      readUserCSS: function(cb, results) {
        return async.map(_this.css, (function(file, mapCb) {
          return fs.readFile(path.resolve(file), mapCb);
        }), cb);
      },
      renderIndexPage: function(cb, results) {
        if (_this.index != null) {
          return _this.render("index.html", {
            destination: _this.index.toString()
          }, cb);
        } else {
          return cb(null);
        }
      },
      writeIndexPage: [
        "renderIndexPage", function(cb, results) {
          if (_this.index != null) {
            return _this.writeFileIfDifferent(outPath_indexHTML, results.renderIndexPage, cb);
          } else {
            return cb(null);
          }
        }
      ],
      writeFilelistJS: function(cb, results) {
        return _this.writeFileIfDifferent(outPath_filelistJS, "var tree=" + (JSON.stringify(_this.tree)) + ";", function() {
          return log("Saved file tree to doc-filelist.js", function() {
            return cb(null);
          });
        });
      },
      writeScriptJS: [
        "readScriptJS", function(cb, results) {
          return _this.writeFileIfDifferent(outPath_docScriptJS, results.readScriptJS, function() {
            return log("Copied JS to doc-script.js", function() {
              return cb(null);
            });
          });
        }
      ],
      concatCSS: [
        "readColorschemeCSS", "genPygmentsCSS", "readUserCSS", function(cb, results) {
          return cb(null, results.readColorschemeCSS.toString() + results.genPygmentsCSS.toString() + results.readUserCSS.join("\n"));
        }
      ],
      writeAllCSS: [
        "concatCSS", function(cb, results) {
          return _this.writeFileIfDifferent(outPath_CSS, results.concatCSS, function() {
            return log("Copied all CSS to doc-style.css", function() {
              return cb(null);
            });
          });
        }
      ]
    }, this.finished);
  };

  Otis.prototype.outFile = function(filename) {
    return path.normalize(filename.replace(path.resolve(this.inDir), this.outDir) + ".html");
  };

  Otis.prototype.render = function(tplName, locals, cb) {
    var rendered, templatePath, tplFn;
    templatePath = path.join(this.tplDir, "" + tplName + "." + this.tplExtension);
    if (this.tplEngine === "internal") {
      tplFn = this.compileTemplate(fs.readFileSync(templatePath).toString());
      rendered = tplFn(locals);
      return cb(null, rendered);
    } else {
      return consolidate[this.tplEngine](templatePath, locals, cb);
    }
  };

  Otis.prototype.compileTemplate = function(str) {
    return new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str.replace(/[\r\t]/g, " ").replace(/(>)\s*\n+(\s*<)/g, "$1\n$2").replace(/(?=<%[^=][^%]*)%>\s*\n*\s*<%(?=[^=])/g, "").replace(/%>\s*(?=\n)/g, "%>").replace(/(?=\n)\s*<%/g, "<%").replace(/\n/g, "~K").replace(/~K(?=[^%]*%>)/g, " ").replace(/~K/g, "\\n").replace(/'(?=[^%]*%>)/g, "\t").split("'").join("\\'").split("\t").join("'").replace(/<%=(.+?)%>/g, "',$1,'").split("<%").join("');").split("%>").join("p.push('") + "');}return p.join('');");
  };

  Otis.prototype.writeFile = function(filename, fileContent, doneLog, doneCallback) {
    var outDir;
    outDir = path.dirname(filename);
    return mkdirp(outDir, function() {
      return fs.unlink(filename, function() {
        return fs.writeFile(filename, fileContent, function() {
          if (doneLog) {
            console.log(doneLog);
          }
          if (doneCallback) {
            return doneCallback();
          }
        });
      });
    });
  };

  Otis.prototype.writeFileIfDifferent = function(filename, fileContent, callback) {
    var outDir;
    outDir = path.dirname(filename);
    return fs.readFile(filename, function(err, content) {
      if (!err && content.toString() === fileContent.toString()) {
        return typeof callback === "function" ? callback() : void 0;
      } else {
        return mkdirp(outDir, function() {
          return fs.unlink(filename, function() {
            return fs.writeFile(filename, fileContent, callback);
          });
        });
      }
    });
  };

  return Otis;

})();
