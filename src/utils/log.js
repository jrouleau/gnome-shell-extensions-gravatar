'use strict';

const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.lib.convenience;

let settings = Convenience.getSettings();

/* exported log */
function log(msg) {
  global.log('[' + Me.uuid + '] ' + msg);
}

/* exported debug */
function debug(msg) {
  if (settings.get_boolean('debug')) {
    log('DEBUG: ' + msg);
  }
}
