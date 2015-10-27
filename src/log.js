'use strict';

const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.lib.convenience;

/* exported log */
function log(msg) {
  global.log('[' + Extension.uuid + '] ' + msg);
}

/* exported debug */
function debug(msg) {
  let settings = Convenience.getSettings();
  if (settings.get_boolean('debug')) {
    log('DEBUG: ' + msg);
  }
}
