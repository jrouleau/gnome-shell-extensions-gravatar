'use strict';

const AccountsService = imports.gi.AccountsService;
const ExtensionUtils = imports.misc.extensionUtils;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.lib.convenience;
const { md5 } = Me.imports.lib.md5;
const { log, debug } = Me.imports.utils.log;
const { isValidEmail } = Me.imports.utils.isValidEmail;
const { setInterval, clearInterval } = Me.imports.utils.timing;


const Extension = new Lang.Class({
  Name: 'Gravatar.Extension',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init: function () {
    debug('initializing');
    this._settings = Convenience.getSettings();
    this._tmpDir = '/tmp';
    this._username = GLib.get_user_name();
    this._user = AccountsService.UserManager.get_default().get_user(this._username);
  },

  /*
   ***********************************************
   * Public Methods                              *
   ***********************************************
   */
  enable: function () {
    debug('enabling');
    this._waitForUser(function () {
      this._changedId = this._settings.connect('changed', this._loadIcon.bind(this));
      this._loadIcon();
    }.bind(this));
  },

  disable: function () {
    debug('disabling');
    if (this._changedId) {
      this._settings.disconnect(this._changedId);
      this._changedId = null;
    }

    if (this._userLoop) {
      clearInterval(this._userLoop);
      this._userLoop = null;
    }

    if (this._httpSession) {
      this._httpSession.abort();
      this._httpSession = null;
    }
  },

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */
  _waitForUser: function (cb) {
    // This fixes an issue where sometimes this._user is not
    // initialized when the extension loads
    if (this._user.isLoaded) {
      cb();
      return;
    }
    debug('Waiting for user to initialize...');
    let loopCount = 0;
    this._userLoop = setInterval(function () {
      loopCount++;
      if (this._user.isLoaded) {
        debug('User initialized');
        clearInterval(this._userLoop);
        this._userLoop = null;
        return cb();
      }
      if (loopCount >= 30) {
        clearInterval(this._userLoop);
        this._userLoop = null;
        log('Timeout waiting for user to initialize');
      }
      return null;
    }.bind(this), 1000);
  },

  /* Settings */
  _getIconSize: function () {
    return this._settings.get_int('icon-size');
  },

  _getHash: function () {
    let email = this._settings.get_string('email').toLowerCase();
    if (!isValidEmail(email)) {
      log('Unable to validate email "' + email + '"');
      return null;
    }
    debug('Hashing "' + email + '"');
    return md5(email);
  },

  /* Set Icon */
  _setIcon: function (icon) {
    log('Setting icon for "' + this._username + '" to "' + icon + '"');
    this._user.set_icon_file(icon);
  },

  /* Download From Gravatar */
  _loadIcon: function () {
    let hash = this._getHash();
    if (hash === null) {
      return;
    }
    try {
      let url = 'http://www.gravatar.com/avatar/' + hash + '?s=' + this._getIconSize() + '&d=mm';
      let request = Soup.Message.new('GET', url);
      let icon = Gio.file_new_for_path(this._tmpDir + '/' + Date.now() + '_' + hash);
      log('Downloading gravatar icon from ' + url);
      debug('Saving to ' + icon.get_path());

      // initialize session
      if (!this._httpSession) {
        debug('Creating new http session');
        this._httpSession = new Soup.Session();
      }
      this._httpSession.abort();

      let fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
      request.connect('got_chunk', function (msg, chunk) {
        fstream.write(chunk.get_data(), null, chunk.length);
      });

      // download file
      this._httpSession.queue_message(request, function (httpSession, msg) {
        fstream.close(null);
        switch (msg.status_code) {
        case 200:
          log('Download successful');
          this._setIcon(icon.get_path());
          break;
        default:
          log('Failed to download ' + url);
        }
        debug('Deleting ' + icon.get_path());
        icon.delete(null);
      }.bind(this));
    } catch (e) {
      log(e.message);
    }
  },

});


/* exported init */
function init() {
  return new Extension();
}
