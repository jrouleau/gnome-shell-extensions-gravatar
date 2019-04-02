'use strict';

const { lang } = imports;
const { Gtk } = imports.gi;
const { extensionUtils } = imports.misc;

const me = extensionUtils.getCurrentExtension();
const { convenience } = me.imports.lib;
const { debug } = me.imports.utils.logger;
const { isValidEmail } = me.imports.utils.isValidEmail;


const Prefs = new lang.Class({
  Name: 'Gravatar.Prefs',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init() {
    this._rtl = Gtk.Widget.get_default_direction() === Gtk.TextDirection.RTL;
    this._settings = convenience.getSettings();

    // Initialize GtkBuilder
    this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(me.metadata['gettext-domain']);
    this._builder.add_from_file(`${me.path}/prefs.ui`);

    // Setup the prefs widget
    this._widget = this._builder.get_object('prefs_widget');
    this._widget.connect('destroy', () => {
      if (this._email !== this._settings.get_string('email')) {
        debug(`Updating email to "${this._email}"`);
        this._settings.set_string('email', this._email);
      }
    });

    // Setup the email settings entry
    const emailObj = this._builder.get_object('email');
    emailObj.connect('changed', (obj) => {
      this._email = obj.get_text().trim();

      if (isValidEmail(this._email)) {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, null);
      } else {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, 'dialog-warning');
      }
    });
    emailObj.set_text(this._settings.get_string('email'));

    // Set the version text
    const versionObj = this._builder.get_object('version');
    versionObj.set_text(me.metadata.version.toString());
  },

  /*
   ***********************************************
   * Public Methods                             *
   ***********************************************
   */
  getWidget() {
    return this._widget;
  },

});


/* exported init */
function init() {
  // Do nothing
}

/* exported buildPrefsWidget */
function buildPrefsWidget() {
  const prefs = new Prefs();
  const widget = prefs.getWidget();
  widget.show_all();
  return widget;
}
