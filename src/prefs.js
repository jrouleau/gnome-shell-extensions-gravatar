'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.lib.convenience;
const { debug } = Me.imports.utils.log;
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

    // Initialize GtkBuilder
    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(Me.metadata['gettext-domain']);
    this._builder.add_from_file(Me.path + '/prefs.ui');

    // Setup the prefs widget
    this._widget = this._builder.get_object('prefs_widget');
    this._widget.connect('destroy', Lang.bind(this, function () {
      if (this._email !== this._settings.get_string('email')) {
        debug('Updating email to "' + this._email + '"');
        this._settings.set_string('email', this._email);
      }
    }));

    // Setup the email settings entry
    let email_obj = this._builder.get_object('email');
    email_obj.connect('changed', Lang.bind(this, function (obj) {
      this._email = obj.get_text().trim();

      if (isValidEmail(this._email)) {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, null);
      } else {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, 'dialog-warning');
      }
    }));
    email_obj.set_text(this._settings.get_string('email'));

    // Set the version text
    let version_obj = this._builder.get_object('version');
    version_obj.set_text(Me.metadata.version.toString());
  },

  /*
   ***********************************************
   * Public Methods                             *
   ***********************************************
   */
  getWidget: function () {
    return this._widget;
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
