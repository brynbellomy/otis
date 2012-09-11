# # tasks
#
# * build     - compiles your src directory to your lib directory
# * watch     - watches any changes in your src directory and automatically compiles to the lib directory
# * install   - copies the build products into your NODE_PATH (i.e. /usr/local/lib/node_modules/MODULE_NAME)
# * uninstall - deletes any installed build products
# * test      - runs mocha test framework
# * docs      - generates annotated documentation using **[otis](http://github.com/brynbellomy/otis)**
# * clean     - deletes the build products folder

MODULE_NAME    = "otis"
SRC_DIR        = "src"
BUILD_DIR      = "build"
LIB_DIR        = "lib"
BIN_DIR        = "bin"
RES_DIR        = "res"
INSTALL_PATH   = "/usr/local/lib/node_modules/#{ MODULE_NAME }"
SYSTEM_BIN_DIR = "/usr/local/bin"
pkgFiles       = ["package.json"]
pkgDirs        = ["node_modules"]

if MODULE_NAME is "YOUR MODULE NAME" then throw new Error "You need to provide a value for the MODULE_NAME variable in your Cakefile."

#
#! required module dependencies
#
fs            = require "fs"
async         = require "async"
walk          = require "walk"
mkdirp        = require "mkdirp"
path          = require "path"
child_process = require "child_process"
{print}       = require "util"
{spawn, exec} = require "child_process"

#
#! optional module dependencies
#
try
  require "colors"
catch err
  console.log "*** Life would be a lot better if you would just type \"npm install -g colors\"..."
  for color in ["red", "green", "grey", "magenta", "bold", "underline", "blue", "cyan", "blue.bold"]
    String::__defineGetter__ color, () -> @toString()

which =
  try require("which").sync
  catch err
    null


#
#! tasks
#
task "docs", "generate documentation", -> otis                      -> do all_tasks_successful
task "build", "compile source", -> build -> arrangeBuildDirAndChmod -> do all_tasks_successful
task "install", "install built library", -> install                 -> do all_tasks_successful
task "uninstall", "uninstall built library", -> uninstall           -> do all_tasks_successful
task "watch", "compile and watch", -> build true,                   -> do all_tasks_successful
task "test", "run tests", -> build -> mocha                         -> do all_tasks_successful
task "clean", "clean generated files", -> clean                     -> do all_tasks_successful


#
#! calculate some paths we're gonna need
#
build_paths = 
  bin: path.join "./", BUILD_DIR, BIN_DIR
  lib: path.join "./", BUILD_DIR, LIB_DIR
  res: path.join "./", BUILD_DIR, RES_DIR

install_paths =
  lib: path.join INSTALL_PATH, LIB_DIR
  bin: path.join INSTALL_PATH, BIN_DIR
  res: path.join INSTALL_PATH, RES_DIR


###!
# Internal Functions
###

###!
## all_tasks_successful
###
all_tasks_successful = ->
  console.log "\n\n[".white + " ALL DONE ENJOY THE FUTURE ".rainbow.bold + "]\n\n".white



###!
## log_phase
###
log_phase = (msg) -> console.log "// --".white.bold + " #{msg} ".red + "->".white.bold



###!
## log_subphase
###
log_subphase = (num, msg, cb) ->
  prefix = Array(num + 2).join("  ")
  console.log "#{prefix}#{msg}"
  if cb then cb null


###!
## launch

- spawn cmd with options
- pipe to process stdout and stderr respectively
- on child process exit emit callback if set and status is 0

@param cmd {String}
@param options {Array}
@param callback {Function}
###
launch = (cmd, options = [], callback) ->
  cmd = which(cmd) if which
  app = spawn cmd, options
  app.stdout.pipe(process.stdout)
  app.stderr.pipe(process.stderr)
  app.on "exit", (status) -> callback?(if status is 0 then null else status) # if status is 0



###!
## build

**given** optional boolean as watch
**and** optional function as callback
**then** invoke launch passing coffee command
**and** defaulted options to compile src to lib
###
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

  dir = path.join "./", BUILD_DIR

  if fs.existsSync dir then child_process.exec "rm -rf #{dir}", (err, stdout, stderr) ->
    if not err then log_subphase 0, "clean successful".cyan
    else log_subphase 0, "error during clean: \"#{err}\"".red

  else log_subphase 0, "nothing to clean.".cyan



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
  log_phase "launching #{"otis".bold} doc generator"
  launch "otis", -> log_subphase 0, "otis is finished.".cyan, -> callback null




# ## *arrangeBuildDirAndChmod*
#
# **given** optional function as callback
arrangeBuildDirAndChmod = (cb) ->
  log_phase "chmodding executables and arranging build dir"

  walker = walk.walk "./#{ SRC_DIR }"

  walker.on "file", (root, fileStats, next) =>
    js_oldname = (path.join "./", root, fileStats.name).replace /.coffee$/, ".js"

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
          log_subphase 1, "#{js_oldname} ".blue.bold + "//".white.bold + " assuming executable (found shebang line).".blue.bold
          #log_subphase 2, "-".white.bold + " compiling...".blue.bold
          log_subphase 2, "-".white.bold + " moving to #{js_newpath.bold}".blue.bold
          fs.renameSync js_fullpath, js_newpath

          # chmod 755
          log_subphase 2, "-".white.bold + " chmodding #{js_newpath} to #{"0o755".bold}".blue.bold
          fs.chmodSync js_newpath, 0o755

          js_fileContents = (fs.readFileSync js_newpath).toString()
          js_fileContents = "#!/usr/bin/env node\n\n#{js_fileContents}"
          fs.writeFileSync js_newpath, js_fileContents, "utf8"

          return next()

    # otherwise it must be a lib file
    # ... so move it to a 'lib' subdir of the build folder
    js_fullpath = path.join "./", BUILD_DIR, fileStats.name.replace(".coffee", ".js")
    js_newpath  = path.join(path.dirname(js_fullpath), LIB_DIR, path.basename(js_fullpath))
    mkdirp.sync path.dirname(js_newpath)
    log_subphase 1, "#{js_oldname} ".magenta + "//".white.bold + " assuming library file.".magenta
    #log_subphase 2, "-".white.bold + " compiling...".magenta
    log_subphase 2, "-".white.bold + " moving to #{js_newpath.bold}".magenta
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



install = (install_phase_cb) ->
  log_phase "installing built products"

  stages =
    printPaths: []
    printRemoveOp: []
    rm: []
    mkdir: []
    printCp: []
    cp: []
    cpPkgFiles: []
    cpPkgDirs: []
    symlink: []

  stages.printRemoveOp.push ((cb) -> log_subphase 1, "removing...".cyan, cb)
  stages.printCp.push       ((cb) -> log_subphase 1, "copying...".cyan, cb)
  for name, the_path of install_paths when install_paths.hasOwnProperty name
    do (name, the_path) ->
      stages.printPaths.push    ((cb) -> log_subphase 1, "#{name} = ".cyan + "#{the_path}".blue.bold, cb)
      stages.printRemoveOp.push ((cb) -> log_subphase 2, "#{the_path}".magenta, cb)   if fs.existsSync the_path
      stages.rm.push            ((cb) -> child_process.exec "rm -rf #{the_path}", cb) if fs.existsSync the_path
      stages.mkdir.push         ((cb) -> mkdirp the_path, cb)
      stages.printCp.push       ((cb) -> log_subphase 2, mkCopyMsg("#{build_paths[name]}/*", "#{install_paths[name]}/"), cb)
      stages.cp.push            ((cb) -> child_process.exec "cp -R '#{build_paths[name]}/' '#{install_paths[name]}'", cb)

  mkCopyMsg = (from, to) -> "#{from}".magenta + " -> ".cyan + "#{to}".magenta.bold

  for file in pkgFiles
    do (file) ->
      file = path.join "./", file
      stages.cpPkgFiles.push    ((cb) -> log_subphase 2, mkCopyMsg(file, path.join(INSTALL_PATH, file)), cb)
      stages.cpPkgFiles.push    ((cb) -> child_process.exec "cp '#{file}' '#{INSTALL_PATH}/'", cb)

  for dir in pkgDirs
    do (dir) ->
      dir = path.join "./", dir
      stages.cpPkgDirs.push     ((cb) -> log_subphase 2, mkCopyMsg(dir, path.join(INSTALL_PATH, dir)), cb)
      stages.cpPkgDirs.push     ((cb) -> child_process.exec "cp -R '#{dir}' '#{INSTALL_PATH}/'", cb)

  # create symlinks for the binaries
  stages.symlink.push (stageCb) ->
    log_subphase 1, "symlinking executables in ".cyan + install_paths.bin.magenta + "...".cyan, ->
      walker = require("walk").walk install_paths.bin
      walker.on "end", -> stageCb null
      walker.on "file", (root, fileStats, next) ->
        filename = path.join root, fileStats.name
        linkname = path.join SYSTEM_BIN_DIR, fileStats.name
        async.series [
            ((seriesCb) -> log_subphase 2, "rm #{linkname}".magenta, seriesCb)
            ((seriesCb) -> child_process.exec "rm '#{linkname}'", (err, stdout, stderr) -> seriesCb null), # ignore errors here
            ((seriesCb) -> log_subphase 2, linkname.magenta.bold + " -> ".cyan + filename.blue.bold, seriesCb)
            ((seriesCb) -> child_process.exec "ln -s '#{filename}' '#{linkname}'", seriesCb),
          ],
          (err, results) ->
            if err then console.log err.toString().red
            next()

  runStagedAuto stages, (err, results) => install_phase_cb err, null

runStagedAuto = (stages, cb) ->
  autoObj = {}
  prev = null
  for stage, fn_list of stages when stages.hasOwnProperty stage
    _prev = prev
    do (stage, _prev) ->
      if _prev? then autoObj[stage] = [ _prev, (stageCb, results) -> async.forEach(stages[stage], ((fn, forCb) -> fn(forCb)), stageCb) ]
      else           autoObj[stage] = [        (stageCb, results) -> async.forEach(stages[stage], ((fn, forCb) -> fn(forCb)), stageCb) ]
      prev = stage

  async.auto autoObj, (err, results) -> cb err, null



uninstall = (cb) ->
  if fs.existsSync INSTALL_PATH
    child_process.exec "rm -rf #{INSTALL_PATH}", ->
      cb null
  else cb null


