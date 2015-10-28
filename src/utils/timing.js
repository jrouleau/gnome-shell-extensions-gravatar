'use strict';

const GLib = imports.gi.GLib;

/* exported setTimeout */
function setTimeout(func, millis) {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, function () {
    func();
    // Don't repeat
    return false;
  });
}

/* exported clearTimeout */
function clearTimeout(id) {
  return GLib.Source.remove(id);
}

/* exported setInterval */
function setInterval(func, millis) {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, function () {
    func();
    // Repeat
    return true;
  });
}

/* exported clearInterval */
function clearInterval(id) {
  return GLib.Source.remove(id);
}

/* exported debounce */
function debounce(func, millis) {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(function () {
      func.apply(context, args);
      timer = null;
    }, millis);
  };
}
