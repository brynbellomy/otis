#!/usr/bin/env node

# Require all node modules
path     = require "path"
watchr   = require "watchr"
fs       = require "fs"

{Otis} = require "otis"

try
  require "colors"
catch e
  for color in ["red", "green", "grey", "magenta", "bold", "underline", "blue", "cyan", "yellow"]
    String::__defineGetter__ color, () -> @.toString()


# Figure out PWD because it doesn't exist in process.env on windows.
pwd = path.resolve "."

configToUse = null
argv = require("optimist").argv
if argv?._[0] is "use" and argv?._[1]? and argv._[1].toString().trim().length > 0    # being a little overcautious here, i know
  configToUse = argv._[1].toString().trim()

# Check for various local config file and load then in order of least-specific to most-specific
configFilenames = []
if configToUse?
  homeCfg = path.join process.env.HOME, ".otis", "otis.config.#{configToUse}.js"
  pwdCfg  = path.join pwd, "otis.config.#{configToUse}.js"
  if not (fs.existsSync(homeCfg) or fs.existsSync(pwdCfg))
    console.log "Config #{configToUse} could not be found in ./ or ~/"
    process.exit()
  else
    configFilenames.push path.join(process.env.HOME, ".otis", "otis.config.js")
    configFilenames.push homeCfg
    configFilenames.push pwdCfg
else
  configFilenames.push path.join(process.env.HOME, ".otis", "otis.config.js")
  configFilenames.push path.join(pwd, "otis.config.js")

localJSConfig = {}
for filename in configFilenames
  try
    _localJSConfig = require filename
    console.log "Using config file '#{filename}'."
    localJSConfig[key] = val for key, val of _localJSConfig when _localJSConfig.hasOwnProperty(key)
  catch err
    continue

# All program arguments using commander
optimist = require("optimist")
  .usage("""

    ===============================================================================
    DOCKER
    Usage: $0 [use <config>] [options] [files to document]

    When 'use <config>' is present, otis will attempt to load config files in the
    following order:
        #{"~/.otis/otis.config.js".red}
        #{"~/.otis/otis.config.<config>.js".red}
        #{"./otis.config.<config>.js".red}
        ... and will bail with an error if neither of the latter two could be found.

    When there is no 'use <config>' argument specified, otis will use this order
    instead:
        #{"~/.otis/otis.config.js".red}
        #{"./otis.config.js".red}

    #{"~/.otis/".red} is also a great place to store your custom templates, etc. as well.
    """)
  .alias("U", "use")           
  .alias("i", "inDir")         .describe("i", "Input directory (defaults to current dir)")                   .default("i", localJSConfig.inDir ? pwd)
  .alias("o", "outDir")        .describe("o", "Output directory (defaults to ./doc)")                        .default("o", localJSConfig.outDir ? path.join(pwd, "doc"))
  .alias("t", "tplDir")        .describe("t", "Directory containing dox.<ext>, code.<ext>, and tmpl.<ext>")  .default("t", localJSConfig.tplDir ? path.join(__dirname, "..", "res"))
  .alias("e", "tplEngine")     .describe("e", "Template parser (see github.com/visionmedia/consolidate.js)") .default("e", localJSConfig.tplEngine ? "internal")
  .alias("n", "tplExtension")  .describe("n", "Template file extension ")                                    .default("n", localJSConfig.tplExtension ? "jst")
  .alias("m", "markdownEngine").describe("m", "Only two choices, cowboy.")                                   .default("m", localJSConfig.markdownEngine ? "marked")
  .alias("u", "onlyUpdated")   .describe("u", "Only process files that have been changed")                   .default("u", localJSConfig.onlyUpdated)
  .alias("c", "colourScheme")  .describe("c", "Color scheme to use (as in pygmentize -L styles)")            .default("c", localJSConfig.colourScheme)
  .alias("y", "css")           .describe("y", "CSS file to include after pygments CSS (you can specify this flag multiple times)").default("y", localJSConfig.css ? [])
  .alias("T", "tolerant")      .describe("T", "Will parse comments without a leading ! (ex: \"/**! ...\")")  .default("T", localJSConfig.tolerant ? false).boolean("T")
  .alias("w", "watch")         .describe("w", "Watch on the input directory for file changes (experimental)").default("w", localJSConfig.watch).boolean("w")
  .alias("I", "ignoreHidden")  .describe("I", "Ignore hidden files and directories (starting with . or _)")  .default("I", localJSConfig.ignoreHidden).boolean("I")
  .alias("s", "sidebarState")  .describe("s", "Whether the sidebar should be open or not by default")        .default("s", localJSConfig.sidebarState ? "yes").boolean("s")
  .alias("x", "exclude")       .describe("x", "Paths to exclude")                                            .default("x", localJSConfig.exclude ? false)
  .alias("W", "writeConfig")   .describe("W", "Write 'otis.config.js' in PWD using the options provided.") .default("W", false).boolean("W")
  .alias("h", "help")          .describe("h", "Show this help text.").default("h", false).boolean("h")
  #.wrap(80) # 80-col output

argv = optimist.argv

# show help and exit if the help flag was given or no input files were given
if argv.help or argv._.length <= 0
  optimist.showHelp()
  process.exit()

# make sure css arg is an array
if argv.css not instanceof Array
  argv.css = [ argv.css ]
  argv.y   = [ argv.y ]

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
  "css",
  "tolerant",
  "ignoreHidden",
  "sidebarState",
  "exclude"
]

console.log "Options:".white.bold
opts = {}
for field in fields when typeof argv[field] isnt undefined
  opts[field] = argv[field]
  console.log field.red + ": ".white + (opts[field] ? "-").toString().grey

# write a otis.config.js file if the writeConfig option was specified
if argv?.writeConfig is yes
  require("fs").writeFileSync(
    path.join(pwd, "otis.config.js"),
    """
    module.exports = #{require('util').inspect(opts)};
    """,
    "utf8")

# Create otis instance
d = new Otis opts

args = argv._
if args.length > 0
  # make sure we remove the 'use x' args from the args list before passing to otis
  newArgv = []
  i = 0
  while i < args.length
    if args[i] is "use" then i += 2
    else
      newArgv.push args[i]
      i++
  args = newArgv


# Set it running.
if argv.watch then d.watch args
else               d.doc   args




