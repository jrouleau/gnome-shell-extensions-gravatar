/* eslint-env node */
'use strict';

let del = require('del');
let gitRev = require('git-rev');
let path = require('path');
let osenv = require('osenv');

let gulp = require('gulp');
let shell = require('gulp-shell');
let symlink = require('gulp-symlink');
let replace = require('gulp-replace');
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


function isInt(value) {
  if (isNaN(value)) {
    return false;
  }
  var x = parseFloat(value);
  return (x | 0) === x;
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
  ]).pipe(gulp.dest('build'));
});

gulp.task('metadata', function () {
  return gitRev.tag(function (commit) {
    return gulp.src(src.metadata)
      .pipe(replace('{{VERSION}}', commit))
      .pipe(gulp.dest('build'));
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
  ]).pipe(symlink(install.local));
});

gulp.task('install', [
  'uninstall',
  'build',
], function () {
  gulp.src([
    'build/**',
  ]).pipe(gulp.dest(install.local));
});

gulp.task('install-global', [
  'uninstall',
  'build',
], function () {
  gulp.src([
    'build/**',
  ]).pipe(gulp.dest(install.global));
});


gulp.task('dist', [
  'build',
], function () {
  return gitRev.tag(function (commit) {
    let versionStr = isInt(commit) ? 'v' + commit : commit;
    let zipFile = metadata.uuid + '-' + versionStr + '.zip';
    return gulp.src([
      'build/**/*',
    ]).pipe(zip(zipFile))
      .pipe(gulp.dest('dist'));
  });
});


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
