'use strict';

const { GLib } = imports.gi;

/* exported setInterval */
function setInterval(func, millis) {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();
    // Repeat
    return true;
  });
}

/* exported clearInterval */
function clearInterval(id) {
  return GLib.Source.remove(id);
}
