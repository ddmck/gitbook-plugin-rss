'use strict';

const title = require('get-md-title');
const desc  = require('get-md-desc');
const RSS   = require('rss');
const write = require('fs').writeFileSync;
const path = require('path');
const parse = require('url').parse;
const shell = require('shelljs');


// Define variables
let site, feed;

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

module.exports = {
  website: {
    assets: './assets',
    js: [ 'plugin.js' ],
  },

  hooks: {
    // Get and init RSS configuration
    init() {
      site = this.config.get('pluginsConfig.rss');
      feed = new RSS(site);
    },

    // Collect all pages
    ['page:before'](page) {
      // If README.md, then change it to root
      const url = site.site_url +
        ( page.path === 'README.md'
        ? ''
        : page.path.replace(/.md$/, '.html'));

      const pageTitle = title(page.content);
      const pageDescription = desc(page.content);
      const pageModifiedDate = new Date(shell.exec("git log -n 1 --format=%cd " + page.rawPath, {silent:true}).stdout.trim())
      feed.item({
        title: pageTitle ? pageTitle.text : '',
        description: pageDescription ? pageDescription.text : '',
        url: url,
        guid: url + "#" + pageModifiedDate.valueOf(),
        date: pageModifiedDate.toUTCString(),
      });

      return page;
    },

    // Generate XML and write to file
    finish() {
      const xml = feed.xml({ indent: true });
      const feedpath = path.basename(parse(site.feed_url).pathname);
      return write(path.resolve(this.options.output, feedpath), xml, 'utf-8');
    },
  }
};
