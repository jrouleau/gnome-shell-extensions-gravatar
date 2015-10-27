/* eslint-env node */
'use strict';

let del = require('del');
let exec = require('child_process').exec;
let path = require('path');
let osenv = require('osenv');

let gulp = require('gulp');
let eol = require('gulp-eol');
let jsonEditor = require('gulp-json-editor');
let shell = require('gulp-shell');
let symlink = require('gulp-symlink');
let zip = require('gulp-zip');

let metadata = require('./src/metadata.json');

let src = {
  copy: [
    'src/**/*',
    '!src/**/*~',
    '!src/schemas{,/**/*}',
    '!src/metadata.json',
  ],
  lib: [
    'lib/**/*',
  ],
  metadata: [
    'src/metadata.json',
  ],
  schemas: [
    'src/schemas/**/*',
  ],
};

let install = {
  local: path.join(
    osenv.home(),
    '.local/share/gnome-shell/extensions',
    metadata.uuid
  ),
  global: path.join(
    '/usr/share/gnome-shell/extensions',
    metadata.uuid
  ),
};


function getVersion(cb) {
  exec(
    'git rev-parse --short HEAD',
    function (error, stdout) {
      if (error !== null) {
        throw error;
      }
      let sha1 = stdout.replace(/\n$/, '');
      exec(
        'git describe --tags --exact-match ' + sha1,
        function (error, stdout) { // eslint-disable-line no-shadow
          if (error !== null) {
            // No tag for commit
            return cb(sha1);
          }
          let tag = stdout.replace(/\n$/, '');
          let version = parseInt(tag.replace(/^v/, ''), 10);
          if (isNaN(version)) {
            throw new Error('Unable to parse version from tag: ' + tag);
          }
          return cb(version);
        }
      );
    }
  );
}


gulp.task('clean', function () {
  return del.sync([
    'build/',
    'dist/',
  ]);
});

gulp.task('copy', function () {
  return gulp.src(src.copy)
    .pipe(gulp.dest('build'));
});

gulp.task('copy-lib', function () {
  return gulp.src(src.lib)
    .pipe(gulp.dest('build/lib'));
});

gulp.task('copy-license', function () {
  return gulp.src([
    'LICENSE',
  ])
    .pipe(gulp.dest('build'));
});

gulp.task('metadata', function (cb) {
  getVersion(function (v) {
    gulp.src(src.metadata)
      .pipe(jsonEditor(function (json) {
        json.version = v;
        return json;
      }))
      .pipe(eol())
      .pipe(gulp.dest('build'));
    cb();
  });
});

gulp.task('schemas', shell.task([
  'mkdir -p build/schemas',
  'glib-compile-schemas --strict --targetdir build/schemas src/schemas/',
]));


gulp.task('build', [
  'clean',
  'metadata',
  'schemas',
  'copy',
  'copy-lib',
  'copy-license',
]);

gulp.task('watch', [
  'build',
], function () {
  gulp.watch(src.copy, [ 'copy' ]);
  gulp.watch(src.lib, [ 'copy-lib' ]);
  gulp.watch(src.metadata, [ 'metadata' ]);
  gulp.watch(src.schemas, [ 'schemas' ]);
});


gulp.task('reset-prefs', shell.task([
  'dconf reset -f /org/gnome/shell/extensions/gravatar/',
]));

gulp.task('uninstall', function () {
  return del.sync([
    install.local,
    install.global,
  ], {
    force: true,
  });
});

gulp.task('install-link', [
  'uninstall',
  'build',
], function () {
  gulp.src([
    'build',
  ])
    .pipe(symlink(install.local));
});

gulp.task('install', [
  'uninstall',
  'build',
], function () {
  gulp.src([
    'build/**',
  ])
    .pipe(gulp.dest(install.local));
});

gulp.task('install-global', [
  'uninstall',
  'build',
], function () {
  gulp.src([
    'build/**',
  ])
    .pipe(gulp.dest(install.global));
});


gulp.task('require-clean-wd', function (cb) {
  exec(
    'git status --porcelain | wc -l',
    function (error, stdout) {
      if (error !== null) {
        throw error;
      }
      if (parseInt(stdout, 10) !== 0) {
        throw new Error(
          'There are uncommited changes in the working directory. Aborting.'
        );
      }
      cb();
    }
  );
});

gulp.task('bump', function (cb) {
  gulp.src([
    'package.json',
  ])
    .pipe(jsonEditor(function (json) {
      json.version++;
      return json;
    }))
    .pipe(eol())
    .pipe(gulp.dest('./'));
  exec(
    'git commit ./package.json -m "Bump package version"',
    function (error) {
      if (error !== null) {
        throw error;
      }
      cb();
    }
  );
});

gulp.task('tag', function (cb) {
  let pkg = require('./package.json');
  let version = 'v' + pkg.version;
  exec(
    'git tag ' + version,
    function (error) {
      if (error !== null) {
        throw error;
      }
      cb();
    }
  );
});

gulp.task('push-tag', function (cb) {
  exec(
    'git push origin --tags',
    function (error) {
      if (error !== null) {
        throw error;
      }
      cb();
    }
  );
});

gulp.task('dist', [
  'build',
], function (cb) {
  getVersion(function (v) {
    let zipFile = metadata.uuid + '-' + v + '.zip';
    gulp.src([
      'build/**/*',
    ])
      .pipe(zip(zipFile))
      .pipe(gulp.dest('dist'));
    cb();
  });
});

gulp.task('release', [
  'bump',
  'tag',
  'push-tag',
  'dist',
]);

gulp.task('default', function () {
  /* eslint-disable no-console, max-len */
  console.log(
    '\n' +
    'Usage: gulp [COMMAND]\n' +
    '\n' +
    'Commands\n' +
    '\n' +
    '  clean                 Cleans the build/ directory\n' +
    '  build                 Builds the extension\n' +
    '  watch                 Builds and watches the src/ directory for changes\n' +
    '  install               Installs the extension to\n' +
    '                        ~/.local/share/gnome-shell/extensions/\n' +
    '  install-link          Installs as symlink to build/ directory\n' +
    '  install-global        Installs the extension to\n' +
    '                        /usr/share/gnome-shell/extensions/\n' +
    '  reset-prefs           Resets extension preferences\n' +
    '  uninstall             Uninstalls the extension\n'
  );
  /* eslint-esnable no-console, max-len */
});
