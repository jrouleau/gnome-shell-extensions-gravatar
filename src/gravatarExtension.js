'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Lang = imports.lang;

const Extension = ExtensionUtils.getCurrentExtension();
const log = Extension.imports.log;

/* exported GravatarExtension */
const GravatarExtension = new Lang.Class({
  Name: 'GravatarExtension',

  _init: function () {
    this.TAG = this.__name__;
    log.i(this.TAG, '_init()');
  },

  enable: function () {
    log.i(this.TAG, 'enable()');
  },

  disable: function () {
    log.i(this.TAG, 'disable()');
  },

});
