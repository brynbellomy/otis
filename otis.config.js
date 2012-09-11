module.exports = {
  inDir: './',
  outDir: '../gh-pages',
  tplDir: require("path").join(process.env.HOME, '.otis', 'templates'),
  tplEngine: 'jade',
  tplExtension: 'jade',
  markdownEngine: 'showdown',
  onlyUpdated: false,
  colourScheme: 'friendly',
  tolerant: false,
  index: 'src/otis.coffee.html',
  ignoreHidden: true,
  sidebarState: true,
  exclude: 'otis.config.js,*.md,doc,node_modules,bin'
};