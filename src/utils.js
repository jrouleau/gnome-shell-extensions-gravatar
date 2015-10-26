'use strict';

const GLib = imports.gi.GLib;

/* exported isValidEmail */
function isValidEmail(email) {
  return GLib.Regex.match_simple(
    '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$',
    email,
    GLib.RegexCompileFlags.CASELESS,
    GLib.RegexMatchFlags.ANCHORED + GLib.RegexMatchFlags.NOTEMPTY
  );
}
