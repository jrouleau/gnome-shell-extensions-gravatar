'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Gdk = imports.gi.Gdk;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.lib.convenience;
const log = Extension.imports.log;
const utils = Extension.imports.utils;

const SCALE_UPDATE_TIMEOUT = 500;
const ICON_SIZES = [ 96, 128, 192, 256 ];

/* exported GravatarPrefs */
const GravatarPrefs = new Lang.Class({
  Name: 'GravatarPrefs',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init: function () {
    this.TAG = this.__name__;

    this.icon_size_scale_timeout = null;
    this.rtl = Gtk.Widget.get_default_direction() === Gtk.TextDirection.RTL;
    this.settings = Convenience.getSettings();

    // CSS Style
    let cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_path(Extension.path + '/prefs.css');
    Gtk.StyleContext.add_provider_for_screen(
      Gdk.Screen.get_default(),
      cssProvider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // GtkBuilder
    this.builder = new Gtk.Builder();
    this.builder.set_translation_domain(Extension.metadata['gettext-domain']);
    this.builder.add_from_file(Extension.path + '/prefs.gtkbuilder');

    // Widget
    this.widget = this.builder.get_object('prefs_notebook');

    // Display current settings
    this.loadSettings();

    // Connect signals to handler
    this.builder.connect_signals_full(
      function (builder, object, signal, handler) {
        if (this.SignalHandler[handler]) {
          object.connect(
            signal,
            this.SignalHandler[handler].bind(this)
          );
        } else {
          log.e(this.TAG, 'Unknown signal: ' + handler);
        }
      }.bind(this)
    );
  },

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */
  loadSettings: function () {
    // debug_switch
    let debug_switch = this.builder.get_object('debug_switch');
    debug_switch.set_active(
      this.settings.get_enum('log-level') === log.VERBOSE
    );

    // email_entry
    let email_entry = this.builder.get_object('email_entry');
    email_entry.set_text(this.settings.get_string('gravatar-email'));

    // icon_size_scale
    let icon_size_scale = this.builder.get_object('icon_size_scale');
    icon_size_scale.set_range(ICON_SIZES[0], ICON_SIZES[ICON_SIZES.length - 1]);
    icon_size_scale.set_value(this.settings.get_int('icon-size'));
    for (let i = 0; i < ICON_SIZES.length; i++) {
      let val = ICON_SIZES[i];
      icon_size_scale.add_mark(val, Gtk.PositionType.BOTTOM, val.toString());
    }
    if (this.rtl) {
      icon_size_scale.set_value_pos(Gtk.PositionType.LEFT);
      icon_size_scale.set_flippable(false);
      icon_size_scale.set_inverted(true);
    }
  },


  SignalHandler: {
    debug_switch_state_set_cb: function (sw, state) {
      // Update debug mode
      log.d(this.TAG, 'Updating log-level');
      if (state) {
        this.settings.set_enum('log-level', log.VERBOSE);
      } else {
        this.settings.set_enum('log-level', log.INFO);
      }
    },

    email_entry_activate_cb: function (entry) {
      // Update email address
      let email = entry.get_text().trim();
      let style = entry.get_style_context();
      style.remove_class('valid');
      if (
        utils.isValidEmail(email) &&
        email !== this.settings.get_string('gravatar-email')
      ) {
        log.d(this.TAG, 'Updating gravatar-email');
        this.settings.set_string('gravatar-email', email);
      }
    },

    email_entry_changed_cb: function (entry) {
      // Validate email address
      let email = entry.get_text().trim();
      let style = entry.get_style_context();
      if (utils.isValidEmail(email)) {
        style.remove_class('invalid');
        style.add_class('valid');
      } else {
        style.remove_class('valid');
        style.add_class('invalid');
      }
    },

    icon_size_scale_format_value_cb: function (scale, value) {
      // Format scale marks
      return value + ' px';
    },

    icon_size_scale_value_changed_cb: function (scale) {
      // Remove existing timeout
      if (this.icon_size_scale_timeout !== null) {
        Mainloop.source_remove(this.icon_size_scale_timeout);
        this.icon_size_scale_timeout = null;
      }

      if (this.icon_size_scale_button_pressed) {
        return;
      }

      // Queue update
      this.icon_size_scale_timeout = Mainloop.timeout_add(
        SCALE_UPDATE_TIMEOUT,
        function () {
          log.d(this.TAG, 'Updating icon-size');
          this.settings.set_int('icon-size', scale.get_value());
          this.icon_size_scale_timeout = null;
          return false;
        }.bind(this)
      );
    },

    icon_size_scale_button_press_event_cb: function (scale) {
      // Prevent updates while button (mouse) is pressed
      this.icon_size_scale_button_pressed = true;
      this.SignalHandler.icon_size_scale_value_changed_cb.bind(this)(scale);
    },

    icon_size_scale_button_release_event_cb: function (scale) {
      // Allow updates when button (mouse) is released
      this.icon_size_scale_button_pressed = false;
      this.SignalHandler.icon_size_scale_value_changed_cb.bind(this)(scale);
    },
  },

});
