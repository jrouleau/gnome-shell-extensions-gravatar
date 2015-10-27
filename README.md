# Gravatar GNOME Shell Extension
A GNOME Shell extension to synchronize your user icon with Gravatar.

## Prerequisites
* `gnome-shell`
* `dconf` _(optional)_
* `gnome-tweak-tool` _(optional)_
* `gnome-shell-extension-prefs` _(optional)_

## Installation

If you wish to install the extension manually, you will need the following tools:
* `git`
* `npm`
* `glib-compile-schemas`
* `dconf` _(optional)_

The packages which include the above tools may vary between different GNU/Linux distributions. Check your distribution's documentation / package list to find the most suitable packages.

```bash
# clone the repository
git clone https://github.com/jrouleau/gnome-shell-extension-gravatar.git
# enter the local repository directory
cd gnome-shell-extension-gravatar
# install the local build dependencies
npm install
# run the build/install toolchain
npm run install
```

#### Uninstall
```bash
npm run uninstall
```

## Settings
All settings can be configured from the `gnome-tweak-tool` or `gnome-shell-extension-prefs` tools or from the command line via `dconf`. **Using the frontent/widget is preferred!**

#### Email Address: _(default: `null`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/email "'<EMAIL>'"
```

#### Icon Size: _(default: `96`)_
* **1 - 2048 pixel square** _(See: [gravatar.com](https://en.gravatar.com/site/implement/images/#size))_
```bash
dconf write /org/gnome/shell/extensions/gravatar/icon-size <SIZE>
```

#### Log Level: _(default: `INFO`)_
* **VERBOSE**
* **DEBUG**
* **INFO**
* **WARN**
* **ERROR**
* **ASSERT**
```bash
dconf write /org/gnome/shell/extensions/gravatar/log-level "'<LEVEL>'"
```

## Bug Reporting
Bugs should be reported via the [GitHub Issue Tracker](https://github.com/jrouleau/gnome-shell-extension-gravatar/issues)

## License
The MIT License (MIT)
