'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.lib.convenience;
const { log, debug } = Me.imports.utils.log;
const { isValidEmail } = Me.imports.utils.isValidEmail;


const Prefs = new Lang.Class({
  Name: 'Gravatar.Prefs',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init: function () {
    this._rtl = Gtk.Widget.get_default_direction() === Gtk.TextDirection.RTL;
    this._settings = Convenience.getSettings();

    // CSS Style
    let cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_path(Me.path + '/prefs.css');
    Gtk.StyleContext.add_provider_for_screen(
      Gdk.Screen.get_default(),
      cssProvider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // GtkBuilder
    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(Me.metadata['gettext-domain']);
    this._builder.add_from_file(Me.path + '/prefs.ui');

    // Widget
    this._widget = this._builder.get_object('prefs_notebook');

    // Display current preferences
    this._loadPrefs();

    // Connect signals to handler
    this._builder.connect_signals_full(function (builder, object, signal, handler) {
      if (this._SignalHandler[handler]) {
        object.connect(signal, this._SignalHandler[handler].bind(this));
      } else {
        log('Unknown signal: ' + handler);
      }
    }.bind(this));
  },

  /*
   ***********************************************
   * Public Methods                             *
   ***********************************************
   */
  getWidget: function () {
    return this._widget;
  },

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */
  _loadPrefs: function () {
    // email_entry
    let email_entry = this._builder.get_object('email_entry');
    email_entry.set_text(this._settings.get_string('email'));

    // version
    let version = this._builder.get_object('version');
    version.set_text(Me.metadata.version.toString());
  },


  _SignalHandler: {
    email_entry_activate_cb: function (entry) {
      // Update email address
      let email = entry.get_text().trim();
      let style = entry.get_style_context();
      style.remove_class('valid');
      if (isValidEmail(email) && email !== this._settings.get_string('email')) {
        debug('Updating email');
        this._settings.set_string('email', email);
      }
    },

    email_entry_changed_cb: function (entry) {
      // Validate email address
      let email = entry.get_text().trim();
      let style = entry.get_style_context();
      if (isValidEmail(email)) {
        style.remove_class('invalid');
        style.add_class('valid');
      } else {
        style.remove_class('valid');
        style.add_class('invalid');
      }
    },
  },

});


/* exported init */
function init() {
  // Do nothing
}

/* exported buildPrefsWidget */
function buildPrefsWidget() {
  let prefs = new Prefs();
  let widget = prefs.getWidget();
  widget.show_all();
  return widget;
}
