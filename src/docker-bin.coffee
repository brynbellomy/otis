#!/usr/bin/env node

# Require all node modules
path     = require "path"
program  = require "commander"
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


# All program arguments using commander
program
  .version("0.1.5")
  .option("-i, --inDir [dir]", "Input directory (defaults to current dir)",                     localJSConfig.inDir          ? pwd)
  .option("-o, --outDir [dir]", "Output directory (defaults to ./doc)",                         localJSConfig.outDir         ? path.join(pwd, "doc"))
  .option("-t, --tplDir [dir]", "Directory containing dox.<ext>, code.<ext>, and tmpl.<ext>",   localJSConfig.tplDir         ? path.join(__dirname, "..", "res"))
  .option("-e, --tplEngine [x]", "Template parser (see github.com/visionmedia/consolidate.js)", localJSConfig.tplEngine      ? "internal")
  .option("-n, --tplExtension [ext]", "Template file extension ",                               localJSConfig.tplExtension   ? "jst")
  .option("-m, --markdownEngine [gfm | marked]", "Only two choices, cowboy.",                   localJSConfig.markdownEngine ? "marked")
  .option("-u, --onlyUpdated", "Only process files that have been changed",                     localJSConfig.onlyUpdated)
  .option("-c, --colourScheme [style]", "Colour scheme to use (as in pygmentize -L styles)",    localJSConfig.colourScheme)
  .option("-w, --watch", "Watch on the input directory for file changes (experimental)",        localJSConfig.watch)
  .option("-I, --ignoreHidden", "Ignore hidden files and directories (starting with . or _)",   localJSConfig.ignoreHidden)
  .option("-s, --sidebarState [state]", "Whether the sidebar should be open or not by default", localJSConfig.sidebarState   ? "yes")
  .option("-x, --exclude [pattern]", "Paths to exclude",                                        localJSConfig.exclude        ? false)
  .parse(process.argv)

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
  opts[field] = program[field]
  console.log field.red + ": ".white + (opts[field] ? "-").grey


# Create docker instance
d = new Docker opts

# If no file list is specified, just run on whole directory
if program.args.length is 0
  program.args = [ "./" ]

# Set it running.
if program.watch
  d.watch program.args
else
  d.doc program.args

