'use strict';

const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();
const { GravatarExtension } = Extension.imports.gravatarExtension;

let extension;

/* exported init */
function init() {
  // Do nothing
}

/* exported enable */
function enable() {
  extension = new GravatarExtension();
  extension.enable();
}

/* exported disable */
function disable() {
  extension.disable();
  extension = null;
}
