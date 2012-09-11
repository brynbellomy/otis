# # tasks
#
# * build     - compiles your src directory to your lib directory
# * watch     - watches any changes in your src directory and automatically compiles to the lib directory
# * install   - copies the build products into your NODE_PATH (i.e. /usr/local/lib/node_modules/MODULE_NAME)
# * uninstall - deletes any installed build products
# * test      - runs mocha test framework
# * docs      - generates annotated documentation using **[otis](http://github.com/brynbellomy/otis)**
# * clean     - deletes the build products folder

MODULE_NAME    = 'otis'
SRC_DIR        = 'src'
BUILD_DIR      = 'build'
LIB_DIR        = 'lib'
BIN_DIR        = 'bin'
RES_DIR        = 'res'
INSTALL_PATH   = "/usr/local/lib/node_modules/#{ MODULE_NAME }"
SYSTEM_BIN_DIR = "/usr/local/bin"

try
  require "colors"
catch err
  console.log "*** Life would be a lot better if you would just type \"npm install -g colors\"..."
  for color in ["red", "green", "grey", "magenta", "bold", "underline", "blue", "cyan", "yellow"]
    String::__defineGetter__ color, () -> @toString()

if MODULE_NAME is "YOUR MODULE NAME" then throw new Error "You need to provide a value for the MODULE_NAME variable in your Cakefile.".red

fs = require 'fs'
async = require 'async'
{print} = require 'util'
{spawn, exec} = require 'child_process'

try
  which = require('which').sync
catch err
  which = null


task 'docs', 'generate documentation', -> otis                    -> do all_tasks_successful
task 'build', 'compile source', -> build -> arrangeBuildDirAndChmod -> do all_tasks_successful
task 'install', 'install built library', -> install                 -> do all_tasks_successful
task 'uninstall', 'uninstall built library', -> uninstall           -> do all_tasks_successful
task 'watch', 'compile and watch', -> build true,                   -> do all_tasks_successful
task 'test', 'run tests', -> build -> mocha                         -> do all_tasks_successful
task 'clean', 'clean generated files', -> clean                     -> do all_tasks_successful




class PriorityMatrixRunner
  ops: {}

  constructor: (@priorities = [], @ops = {}) ->


  add_op: (priority, fn) =>
    @ops[priority] ?= []
    @ops[priority].push fn

  run: (run_cb) =>
    priority_matrix = {}
    first = yes
    previous = null

    for priority in @priorities
      priority_ops = @ops[ priority ]
      if priority_ops?
        __previous = previous
        do (priority, priority_ops, __previous) =>
          if first then priority_matrix[priority] =               (cb) -> fn(cb) for fn in priority_ops
          else          priority_matrix[priority] = [ __previous, (cb) -> fn(cb) for fn in priority_ops ]
          first = no
          previous = priority

    async.auto priority_matrix, (err, results) -> run_cb err, results




# Internal Functions

# ## *all_tasks_successful*
#
all_tasks_successful = ->
  console.log "\n\n[".white + " ALL DONE ENJOY THE FUTURE ".rainbow.bold + "]\n\n".white

log_phase = (msg) -> console.log "+".white.bold + " #{msg} ".red + "->".white.bold
log_subphase = (num, msg, cb) ->
  prefix = Array(num + 2).join("  ")
  console.log "#{prefix}#{msg}"
  if cb then cb null

# ## *walk* 
#
# **given** string as dir which represents a directory in relation to local directory
# **and** callback as done in the form of (err, results)
# **then** recurse through directory returning an array of files
walk = (dir, done) ->
  results = []
  fs.readdir dir, (err, list) ->
    return done(err, []) if err
    pending = list.length
    return done(null, results) unless pending
    for name in list
      file = "#{dir}/#{name}"
      try
        stat = fs.statSync file
      catch err
        stat = null
      if stat?.isDirectory()
        walk file, (err, res) ->
          results.push name for name in res
          done(null, results) unless --pending
      else
        results.push file
        done(null, results) unless --pending

# ## *launch*
#
# **given** string as a cmd
# **and** optional array and option flags
# **and** optional callback
# **then** spawn cmd with options
# **and** pipe to process stdout and stderr respectively
# **and** on child process exit emit callback if set and status is 0
launch = (cmd, options = [], callback) ->
  cmd = which(cmd) if which
  app = spawn cmd, options
  app.stdout.pipe(process.stdout)
  app.stderr.pipe(process.stderr)
  app.on "exit", (status) -> callback?(if status is 0 then null else status) # if status is 0

# ## *build*
#
# **given** optional boolean as watch
# **and** optional function as callback
# **then** invoke launch passing coffee command
# **and** defaulted options to compile src to lib
build = (watch, callback) ->
  log_phase "compiling coffeescript"

  if typeof watch is 'function'
    callback = watch
    watch = false

  options = ['-c', '-b', '-o' ]
  options = options.concat [ BUILD_DIR, SRC_DIR ]
  options.unshift '-w' if watch
  launch 'coffee', options, (err) -> 
    if not err
      log_subphase 0, "no problems with build.".cyan
      do callback
    else
      log_subphase 0, "build failed with status ".cyan + "#{err}".white

# ## *unlinkIfCoffeeFile*
#
# **given** string as file
# **and** file ends in '.coffee'
# **then** convert '.coffee' to '.js'
# **and** remove the result
unlinkIfCoffeeFile = (file) ->
  if file.match /\.coffee$/
    fs.unlink file.replace(/\.coffee$/, '.js')
    true
  else false

# ## *clean*
#
# **given** optional function as callback
# **then** loop through files variable
# **and** call unlinkIfCoffeeFile on each
clean = (callback) ->
  log_phase "cleaning built products directory"

  fs            = require "fs"
  child_process = require "child_process"
  path          = require "path"
  dir           = path.join "./", BUILD_DIR

  if fs.existsSync dir then child_process.exec "rm -rf #{dir}", (err, stdout, stderr) ->
    if not err then log_subphase 0, "clean successful".cyan
    else log_subphase 0, "error during clean: \"#{err}\"".red

  else log_subphase 0, "nothing to clean.".cyan

  # rmdirIfExists = (dir) ->
  #   dir = path.resolve(path.join "./", dir)
  #   if fs.existsSync dir then child_process.exec "rm -rf #{dir}"
  
  # for file in [ BUILD_DIR,  ]



# ## *moduleExists*
#
# **given** name for module
# **when** trying to require module
# **and** not found
# **then* print not found message with install helper in red
# **and* return false if not found
moduleExists = (name) ->
  try 
    require name 
  catch err 
    log "#{name} required: npm install #{name}", red
    false


# ## *mocha*
#
# **given** optional array of option flags
# **and** optional function as callback
# **then** invoke launch passing mocha command
mocha = (options, callback) ->
  #if moduleExists('mocha')
  if typeof options is 'function'
    callback = options
    options = []
  
  launch 'mocha', options, callback

# ## *otis*
#
# **given** optional function as callback
# **then** invoke launch passing otis command
otis = (callback) ->
  log_phase "launching otis"
  launch "otis", ->
    log_subphase 0, "otis is finished.".cyan
    callback null


arrangeBuildDirAndChmod = (cb) ->
  log_phase "chmodding executables and arranging build dir"

  path   = require "path"
  mkdirp = require "mkdirp"
  walk   = require "walk"
  walker = walk.walk "./#{ SRC_DIR }"

  walker.on "file", (root, fileStats, next) =>
    js_oldname  = path.join "./", root, fileStats.name 

    if /\.coffee$/i.test fileStats.name
      coffee_fullpath = path.join root, fileStats.name
      coffee_fileContents = (fs.readFileSync coffee_fullpath).toString()

      # look for shebang
      if coffee_fileContents.trim().indexOf("#!") is 0
        js_fullpath = path.join "./", BUILD_DIR, fileStats.name.replace(".coffee", ".js")
        orig_basename = path.basename(js_fullpath)
        
        stats = fs.lstatSync js_fullpath
        if stats.isFile() is true

          # move it to a 'bin' subdir of the build folder
          js_newpath = path.join(path.dirname(js_fullpath), BIN_DIR, orig_basename)
          mkdirp.sync path.dirname(js_newpath)

          # remove the .js ending, also remove -bin prefix if it's found
          js_newpath = js_newpath.replace(/-bin\.js$/, "").replace(/\.js$/, "")
          log_subphase 0, "#{js_oldname} ".yellow + "//".white.bold + " Assuming executable (found shebang line).".yellow
          log_subphase 1, "  -- Moving to #{js_newpath}".yellow
          fs.renameSync js_fullpath, js_newpath

          # chmod 755
          fs.chmodSync js_newpath, 0o755

          js_fileContents = (fs.readFileSync js_newpath).toString()
          js_fileContents = "#!/usr/bin/env node\n\n#{js_fileContents}"
          fs.writeFileSync js_newpath, js_fileContents, "utf8"

          log_subphase 1, "  -- Chmodding #{js_newpath} to 0o755".yellow
          return next()

    # otherwise it must be a lib file
    # ... so move it to a 'lib' subdir of the build folder
    js_fullpath = path.join "./", BUILD_DIR, fileStats.name.replace(".coffee", ".js")
    js_newpath  = path.join(path.dirname(js_fullpath), LIB_DIR, path.basename(js_fullpath))
    mkdirp.sync path.dirname(js_newpath)
    log_subphase 0, "#{js_oldname} ".magenta + "//".white.bold + " Assuming library file.".magenta
    log_subphase 1, "  -- Compiling and moving to #{js_newpath}".magenta
    fs.renameSync js_fullpath, js_newpath

    next()


  walker.on "end", ->
    child_process = require "child_process"
    
    # finally, move the resources into the build dir
    log_subphase 0, "copying resources to build folder".cyan

    unbuilt_res_dir = path.join "./", RES_DIR
    built_res_dir   = path.join "./", BUILD_DIR, RES_DIR
    child_process.exec "rm -rf #{ built_res_dir } && cp -R #{ unbuilt_res_dir } #{ built_res_dir }", (err, stdout, stderr) =>
      if err then throw new Error err
      cb null



install = (cb) ->
  log_phase "installing built products"

  mkdirp        = require "mkdirp"
  path          = require "path"
  child_process = require "child_process"

  build_bin = path.join "./", BUILD_DIR, BIN_DIR
  build_lib = path.join "./", BUILD_DIR, LIB_DIR
  build_res = path.join "./", BUILD_DIR, RES_DIR
  # mkdirp.sync build_bin
  # mkdirp.sync build_lib

  install_paths =
    lib: path.join INSTALL_PATH, LIB_DIR
    bin: path.join INSTALL_PATH, BIN_DIR
    res: path.join INSTALL_PATH, RES_DIR

  matrix = new PriorityMatrixRunner [ "priority_printPaths", "priority_printRemoveOp", "priority_rm", "priority_mkdir" ]

  for name, the_path of install_paths
    do (name, the_path) ->
      matrix.add_op "priority_printPaths", (cb) -> log_subphase 0, "#{name} path: ".cyan + "#{the_path}".yellow, cb

      if fs.existsSync the_path
        matrix.add_op "priority_printRemoveOp", (cb) -> log_subphase 0, "Removing ".cyan + "#{the_path}".yellow, cb
        matrix.add_op "priority_rm",            (cb) -> child_process.exec "rm -rf #{the_path}", (err, stdout, stderr) -> cb err
        matrix.add_op "priority_mkdir",         (cb) -> mkdirp the_path, cb

  matrix.run (err) ->
    # copy everything into /usr/local/lib/node_modules/{MODULE_NAME}
    log_subphase 0, "Copying built products into ".cyan + "#{INSTALL_PATH}".magenta

    install_commands = [
      "cp ./package.json '#{INSTALL_PATH}/'",
      "cp -R ./node_modules '#{INSTALL_PATH}/'",
      "cp -R '#{build_lib}/' '#{install_paths.lib}'",
      "cp -R '#{build_bin}/' '#{install_paths.bin}'",
      "cp -R '#{build_res}/' '#{install_paths.res}'"
    ]
    child_process.exec install_commands.join("&&"), (err, stdout, stderr) ->
      walk = require "walk"
      walker = walk.walkSync install_paths.bin

      # create symlinks for the binaries
      walker.on "file", (root, fileStats, next) =>
        filename = path.join root, fileStats.name
        linkname = path.join SYSTEM_BIN_DIR, fileStats.name
        log_subphase 0, "Linking executable: ".cyan + "(ln -s #{filename} ".yellow + "#{linkname}".magenta + ")".yellow
        child_process.exec "rm '#{linkname}' && ln -s '#{filename}' '#{linkname}'"
        next()

      walker.on "end", -> cb null



uninstall = (cb) ->
  fs            = require "fs"
  child_process = require "child_process"

  if fs.existsSync INSTALL_PATH
    child_process.exec "rm -rf #{INSTALL_PATH}", ->
      cb null
  else cb null


