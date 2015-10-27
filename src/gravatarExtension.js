'use strict';

const AccountsService = imports.gi.AccountsService;
const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;

const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.lib.convenience;
const log = Extension.imports.log;
const { isValidEmail } = Extension.imports.utils.isValidEmail;
const { md5 } = Extension.imports.lib.md5;

/* exported GravatarExtension */
const GravatarExtension = new Lang.Class({
  Name: 'GravatarExtension',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init: function () {
    this.TAG = this.__name__;

    this.settings = Convenience.getSettings();
    this.tmpDir = '/tmp';
    this.user = GLib.get_user_name();
    this.userManager = AccountsService
      .UserManager
      .get_default()
      .get_user(this.user);
  },

  /*
   ***********************************************
   * Public Methods                              *
   ***********************************************
   */
  enable: function () {
    this.waitForUserManager(function () {
      this.fetchGravatarIcon();
      this.settingsChangedHandler = this.settings.connect(
        'changed',
        function (settings, key) {
          log.d(this.TAG, 'Setting changed: ' + key);
          if (key !== 'log-level') {
            this.fetchGravatarIcon();
          }
        }.bind(this)
      );
    }.bind(this));
  },

  disable: function () {
    // Disconnect settings changed handler
    if (this.settingsChangedHandler) {
      this.settings.disconnect(this.settingsChangedHandler);
      this.settingsChangedHandler = null;
    }

    // Remove userManager initialization loop
    if (this.userManagerLoop) {
      Mainloop.source_remove(this.userManagerLoop);
      this.userManagerLoop = null;
    }

    // Abort httpSession
    if (this.httpSession) {
      this.httpSession.abort();
    }
  },

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */
  waitForUserManager: function (cb) {
    if (this.userManager.get_icon_file() !== null) {
      cb();
      return;
    }
    log.d(this.TAG, 'Waiting for userManager to initialize...');
    // This fixes an issue where this.userManager properties sometimes aren't
    // initialized when the extension loads
    this.userManagerLoop = Mainloop.timeout_add_seconds(1, function () {
      if (this.userManager.get_icon_file() !== null) {
        log.d(this.TAG, 'userManager initialized');
        this.userManagerLoop = null;
        cb();
        // exit loop
        return false;
      }
      // continue loop
      return true;
    }.bind(this));
  },

  /* Settings */
  getIconSize: function () {
    return this.settings.get_int('icon-size');
  },

  getHash: function () {
    let email = this.settings.get_string('gravatar-email').toLowerCase();
    if (!isValidEmail(email)) {
      log.e(this.TAG, 'Unable to validate email "' + email + '"');
      return null;
    }
    log.d(this.TAG, 'Hashing "' + email + '"');
    return md5(email);
  },

  /* Set Icon */
  setIcon: function (icon) {
    log.d(this.TAG, 'Setting icon for "' + this.user + '" to "' + icon + '"');
    this.userManager.set_icon_file(icon);
  },

  /* Download From Gravatar */
  fetchGravatarIcon: function () {
    let hash = this.getHash();
    if (hash === null) {
      return;
    }
    try {
      let url =
        'http://www.gravatar.com/avatar/' + hash + '?s=' +
        this.getIconSize() + '&d=mm';
      let request = Soup.Message.new('GET', url);
      let icon = Gio.file_new_for_path(
        this.tmpDir + '/' + Date.now() + '_' + hash
      );
      log.i(this.TAG, 'Downloading gravatar icon from ' + url);
      log.d(this.TAG, 'Saving to ' + icon.get_path());

      // initialize session
      if (!this.httpSession) {
        log.d(this.TAG, 'Creating new http session');
        this.httpSession = new Soup.Session();
      }
      this.httpSession.abort();

      let fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
      request.connect('got_chunk', function (msg, chunk) {
        fstream.write(chunk.get_data(), null, chunk.length);
      });

      // download file
      this.httpSession.queue_message(request, function (httpSession, msg) {
        fstream.close(null);
        switch (msg.status_code) {
        case 200:
          log.i(this.TAG, 'Download successful');
          this.setIcon(icon.get_path());
          break;
        default:
          log.w(this.TAG, 'Failed to download ' + url);
        }
        log.d(this.TAG, 'Deleting ' + icon.get_path());
        icon.delete(null);
      }.bind(this));
    } catch (e) {
      log.e(this.TAG, e.message);
    }
  },

});
