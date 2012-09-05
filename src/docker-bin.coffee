#!/usr/bin/env node

# Require all node modules
path     = require "path"
watchr   = require "watchr"
fs       = require "fs"

{Docker} = require "docker"

try
  require "colors"
catch e
  for color in ["red", "green", "grey", "magenta", "bold", "underline", "blue", "cyan", "yellow"]
    String::__defineGetter__ color, () -> @.toString()


# Figure out PWD because it doesn't exist in process.env on windows.
pwd = path.resolve "."

# Check for local config file
localJSConfig = (
  try
    _localConfig = require path.join(pwd, "docker.config.js")
    console.log "Using docker.config.js config file in PWD"
    _localConfig
  catch err
    console.log "err!", err
    {}
)

console.log localJSConfig

# All program arguments using commander
argv = require("optimist")
  .alias("i", "inDir")         .describe("i", "Input directory (defaults to current dir)")                   .default("i", localJSConfig.inDir ? pwd)
  .alias("o", "outDir")        .describe("o", "Output directory (defaults to ./doc)")                        .default("o", localJSConfig.outDir ? path.join(pwd, "doc"))
  .alias("t", "tplDir")        .describe("t", "Directory containing dox.<ext>, code.<ext>, and tmpl.<ext>")  .default("t", localJSConfig.tplDir ? path.join(__dirname, "..", "res"))
  .alias("e", "tplEngine")     .describe("e", "Template parser (see github.com/visionmedia/consolidate.js)") .default("e", localJSConfig.tplEngine ? "internal")
  .alias("n", "tplExtension")  .describe("n", "Template file extension ")                                    .default("n", localJSConfig.tplExtension ? "jst")
  .alias("m", "markdownEngine").describe("m", "Only two choices, cowboy.")                                   .default("m", localJSConfig.markdownEngine ? "marked")
  .alias("u", "onlyUpdated")   .describe("u", "Only process files that have been changed")                   .default("u", localJSConfig.onlyUpdated)
  .alias("c", "colourScheme")  .describe("c", "Colour scheme to use (as in pygmentize -L styles)")           .default("c", localJSConfig.colourScheme)
  .alias("w", "watch")         .describe("w", "Watch on the input directory for file changes (experimental)").default("w", localJSConfig.watch)
  .alias("I", "ignoreHidden")  .describe("I", "Ignore hidden files and directories (starting with . or _)")  .default("I", localJSConfig.ignoreHidden)
  .alias("s", "sidebarState")  .describe("s", "Whether the sidebar should be open or not by default")        .default("s", localJSConfig.sidebarState ? "yes")
  .alias("x", "exclude")       .describe("x", "Paths to exclude")                                            .default("x", localJSConfig.exclude ? false)
  .argv

# Super-simple function to test if an argument is vaguely trueish or falseish.
# Should match `true`, `false`, `0`, `1`, `'0'`, `'1'`, `'y'`, `'n'`, `'yes'`, `'no'`, `'ok'`, `'true'`, `'false'`
booleanish = (input) ->
  return input  if input is true or input is false
  return !!+input  if typeof input is "number" or (+input + "" is input + "")
  input = input.toString()
  (if input is "" then true else /(y(es)?|ok|t(rue)?)/i.test(input))


# Put all the options into an object
fields = [
  "inDir",
  "outDir",
  "tplDir",
  "tplEngine",
  "tplExtension",
  "markdownEngine",
  "onlyUpdated",
  "colourScheme",
  "ignoreHidden",
  "sidebarState",
  "exclude"
]

console.log "Options:".white.bold
opts = {}
for field in fields
  opts[field] = argv[field]
  console.log field.red + ": ".white + (opts[field] ? "-").grey


# Create docker instance
d = new Docker opts

# If no file list is specified, just run on whole directory
if argv._.length is 0
  argv._ = [ "./" ]

# Set it running.
if argv.watch then d.watch argv._
else               d.doc argv._

