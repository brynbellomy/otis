module.exports = {
  inDir: './',
  outDir: './doc',
  tplDir: process.HOME + '/.docker/templates',
  tplEngine: 'jade',
  tplExtension: 'jade',
  markdownEngine: 'showdown',
  onlyUpdated: false,
  colourScheme: 'friendly',
  tolerant: false,
  ignoreHidden: true,
  sidebarState: true,
  exclude: 'docker.config.js,*.md,doc,node_modules,bin'
};