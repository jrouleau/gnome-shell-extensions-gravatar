/* global log */

/*
 * Inspired by the android Log util:
 * http://developer.android.com/reference/android/util/Log.html
 */

'use strict';

const ExtensionUtils = imports.misc.extensionUtils;

const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.lib.convenience;

const VERBOSE = 2;
const DEBUG = 3;
const INFO = 4;
const WARN = 5;
const ERROR = 6;
const ASSERT = 7;

function _shouldPrint(priority) {
  let settings = Convenience.getSettings();
  let logLevel = settings.get_enum('log-level');
  return priority >= logLevel;
}

function _getPriorityStr(priority) {
  switch (priority) {
  case VERBOSE:
    return 'v';
  case DEBUG:
    return 'd';
  case INFO:
    return 'i';
  case WARN:
    return 'w';
  case ERROR:
    return 'e';
  case ASSERT:
    return 'a';
  default:
    return null;
  }
}

function _println(priority, tag, msg) {
  if (_shouldPrint(priority)) {
    log(
      '[' + Extension.uuid + '] ' +
      _getPriorityStr(priority) + '/' + tag + ': ' +
      msg
    );
  }
}

/* exported v */
function v(tag, msg) {
  _println(VERBOSE, tag, msg);
}

/* exported d */
function d(tag, msg) {
  _println(DEBUG, tag, msg);
}

/* exported i */
function i(tag, msg) {
  _println(INFO, tag, msg);
}

/* exported w */
function w(tag, msg) {
  _println(WARN, tag, msg);
}

/* exported e */
function e(tag, msg) {
  _println(ERROR, tag, msg);
}

/* exported wtf */
function wtf(tag, msg) {
  _println(ASSERT, tag, msg);
}
