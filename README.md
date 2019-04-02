# Gravatar GNOME Shell Extension
[![Build Status][travis-image]][travis-url] [![Dependency Status][deps-image]][deps-url]

A GNOME Shell extension to synchronize your user icon with Gravatar.

## Prerequisites
* `gnome-shell`
* `dconf` _(optional)_
* `gnome-tweaks` _(optional)_
* `gnome-shell-extension-prefs` _(optional)_

## Installation

If you wish to build and install the extension manually, you will need the following tools:
* `git`
* `npm` - Node Package Manager
* `node` - Node.js (>= 8.0.0)
* `glib-compile-schemas`
* `dconf` _(optional)_

The packages which include the above tools may vary between different GNU/Linux distributions. Check your distribution's documentation / package list to find the most suitable packages.

```bash
# clone the repository
git clone https://github.com/jrouleau/gnome-shell-extensions-gravatar.git
# enter the local repository directory
cd gnome-shell-extensions-gravatar
# install the local build dependencies
npm install
# run the build/install toolchain
npm run install-extension
```

#### Uninstall
```bash
npm run uninstall-extension
```

## Settings
All settings can be configured from the `gnome-tweaks` or `gnome-shell-extension-prefs` tools or from the command line via `dconf`. **Using the frontend/widget is preferred!**

#### Debug Mode: _(default: `false`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/debug "'<BOOL>'"
```

#### Email Address: _(default: `null`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/email "'<EMAIL>'"
```

#### Icon Size: _(default: `192`)_
* **1 - 2048 pixel square** _(See: [gravatar.com](https://en.gravatar.com/site/implement/images/#size))_

```bash
dconf write /org/gnome/shell/extensions/gravatar/icon-size <SIZE>
```

## Bug Reporting
Bugs should be reported via the [GitHub Issue Tracker](https://github.com/jrouleau/gnome-shell-extensions-gravatar/issues)

## License
The MIT License (MIT)


[travis-url]: https://travis-ci.org/jrouleau/gnome-shell-extensions-gravatar
[travis-image]: http://img.shields.io/travis/jrouleau/gnome-shell-extensions-gravatar/master.svg

[deps-url]: https://david-dm.org/jrouleau/gnome-shell-extensions-gravatar
[deps-image]: https://img.shields.io/david/dev/jrouleau/gnome-shell-extensions-gravatar.svg
