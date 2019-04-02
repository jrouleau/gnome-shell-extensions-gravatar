'use strict';

const { lang } = imports;
const {
  AccountsService,
  Gio,
  GLib,
  Soup,
} = imports.gi;
const { extensionUtils } = imports.misc;

const me = extensionUtils.getCurrentExtension();
const { convenience } = me.imports.lib;
const { md5 } = me.imports.lib.md5;
const { log, debug } = me.imports.utils.logger;
const { setInterval, clearInterval } = me.imports.utils.timing;


const Extension = new lang.Class({
  Name: 'Gravatar.Extension',

  /*
   ***********************************************
   * Constructor                                 *
   ***********************************************
   */
  _init() {
    debug('initializing');
    this._settings = convenience.getSettings();
    this._tmpDir = '/tmp';
    this._username = GLib.get_user_name();
    this._user = AccountsService.UserManager.get_default().get_user(this._username);
  },

  /*
   ***********************************************
   * Public Methods                              *
   ***********************************************
   */
  enable() {
    debug('enabling');
    this._waitForUser(() => {
      this._changedId = this._settings.connect('changed', this._loadIcon.bind(this));
      this._loadIcon();
    });
  },

  disable() {
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
  _waitForUser(cb) {
    // This fixes an issue where sometimes this._user is not
    // initialized when the extension loads
    if (this._user.isLoaded) {
      cb();
      return;
    }
    debug('Waiting for user to initialize...');
    let loopCount = 0;
    this._userLoop = setInterval(() => {
      loopCount += 1;
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
    }, 1000);
  },

  /* Settings */
  _getIconSize() {
    return this._settings.get_int('icon-size');
  },

  _getHash() {
    const email = this._settings.get_string('email').toLowerCase();
    debug(`Hashing "${email}"`);
    return md5(email);
  },

  /* Set Icon */
  _setIcon(icon) {
    log(`Setting icon for "${this._username}" to "${icon}"`);
    this._user.set_icon_file(icon);
  },

  /* Download From Gravatar */
  _loadIcon() {
    const hash = this._getHash();
    if (hash === null) {
      return;
    }
    try {
      const url = `http://www.gravatar.com/avatar/${hash}?s=${this._getIconSize()}&d=mm`;
      const request = Soup.Message.new('GET', url);
      const icon = Gio.file_new_for_path(`${this._tmpDir}/${Date.now()}_${hash}`);
      log(`Downloading gravatar icon from ${url}`);
      debug(`Saving to ${icon.get_path()}`);

      // initialize session
      if (!this._httpSession) {
        debug('Creating new http session');
        this._httpSession = new Soup.Session();
      }
      this._httpSession.abort();

      const fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
      request.connect('got_chunk', (msg, chunk) => {
        fstream.write(chunk.get_data(), null);
      });

      // download file
      this._httpSession.queue_message(request, (httpSession, msg) => {
        fstream.close(null);
        switch (msg.status_code) {
          case 200:
            log('Download successful');
            this._setIcon(icon.get_path());
            break;
          default:
            log(`Failed to download ${url}`);
        }
        debug(`Deleting ${icon.get_path()}`);
        icon.delete(null);
      });
    } catch (e) {
      log(e.message);
    }
  },

});


/* exported init */
function init() {
  return new Extension();
}
