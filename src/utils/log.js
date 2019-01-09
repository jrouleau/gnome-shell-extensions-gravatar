'use strict';

const { extensionUtils } = imports.misc;

const me = extensionUtils.getCurrentExtension();
const { convenience } = me.imports.lib;

const settings = convenience.getSettings();

/* exported log */
function log(msg) {
  global.log(`[${me.uuid}] ${msg}`);
}

/* exported debug */
function debug(msg) {
  if (settings.get_boolean('debug')) {
    log(`DEBUG: ${msg}`);
  }
}
