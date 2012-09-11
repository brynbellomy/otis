module.exports = {
  inDir: './',
  outDir: './doc',
  tplDir: require("path").join(process.env.HOME, '.otis', 'templates'),
  tplEngine: 'jade',
  tplExtension: 'jade',
  markdownEngine: 'showdown',
  onlyUpdated: false,
  colourScheme: 'friendly',
  tolerant: false,
  ignoreHidden: true,
  sidebarState: true,
  exclude: 'otis.config.js,*.md,doc,node_modules,bin'
};