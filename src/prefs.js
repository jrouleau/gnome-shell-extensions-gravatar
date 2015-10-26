'use strict';

const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();
const { GravatarPrefs } = Extension.imports.gravatarPrefs;

/* exported init */
function init() {
  // Do nothing
}

/* exported buildPrefsWidget */
function buildPrefsWidget() {
  let prefs = new GravatarPrefs();
  let widget = prefs.widget;
  widget.show_all();
  return widget;
}
