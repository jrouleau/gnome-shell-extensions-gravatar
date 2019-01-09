const del = require('del');
const { execSync } = require('child_process');
const osenv = require('osenv');
const path = require('path');

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const threshold = require('gulp-eslint-threshold');
const jsonEditor = require('gulp-json-editor');
const shell = require('gulp-shell');
const symlink = require('gulp-symlink');
const zip = require('gulp-zip');

const metadata = require('./src/metadata.json');

const paths = {
  src: [
    'src/**/*',
    '!src/**/*~',
    '!src/schemas{,/**/*}',
    '!src/metadata.json',
    '!src/.eslintrc',
  ],
  lib: ['lib/**/*'],
  metadata: ['src/metadata.json'],
  schemas: ['src/schemas/**/*'],
  install: path.join(
    osenv.home(),
    '.local/share/gnome-shell/extensions',
    metadata.uuid,
  ),
};

function getVersion(rawTag) {
  const sha1 = execSync('git rev-parse --short HEAD').toString().replace(/\n$/, '');
  let tag;
  try {
    tag = execSync(`git describe --tags --exact-match ${sha1} 2>/dev/null`).toString().replace(/\n$/, '');
  } catch (e) {
    return sha1;
  }

  if (rawTag) {
    return tag;
  }

  const v = parseInt(tag.replace(/^v/, ''), 10);
  if (Number.isNaN(v)) {
    throw new Error(`Unable to parse version from tag: ${tag}`);
  }
  return v;
}

gulp.task('lint', () => {
  const thresholdWarnings = 1;
  const thresholdErrors = 1;
  return gulp.src(['**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(threshold.afterErrors(thresholdErrors, (numberOfErrors) => {
      throw new Error(`ESLint errors (${numberOfErrors}) equal to or greater than the threshold (${thresholdErrors})`);
    }))
    .pipe(threshold.afterWarnings(thresholdWarnings, (numberOfWarnings) => {
      throw new Error(`ESLint warnings (${numberOfWarnings}) equal to or greater than the threshold (${thresholdWarnings})`);
    }));
});

gulp.task('clean', cb => del(['build/'], cb));

gulp.task('copy', () => gulp.src(paths.src).pipe(gulp.dest('build')));

gulp.task('copy-lib', () => gulp.src(paths.lib).pipe(gulp.dest('build/lib')));

gulp.task('copy-license', () => gulp.src(['LICENSE']).pipe(gulp.dest('build')));

gulp.task('metadata', () => gulp.src(paths.metadata).pipe(jsonEditor(json => Object.assign(json, { version: getVersion() }), { end_with_newline: true })).pipe(gulp.dest('build')));

gulp.task('schemas', shell.task([
  'mkdir -p build/schemas',
  'glib-compile-schemas --strict --targetdir build/schemas src/schemas/',
]));

gulp.task('build', gulp.series('clean', gulp.parallel(
  'metadata',
  'schemas',
  'copy',
  'copy-lib',
  'copy-license',
)));

gulp.task('watch', gulp.series('build', () => {
  gulp.watch(paths.src, gulp.series('copy'));
  gulp.watch(paths.lib, gulp.series('copy-lib'));
  gulp.watch(paths.metadata, gulp.series('metadata'));
  gulp.watch(paths.schemas, gulp.series('schemas'));
}));

gulp.task('reset-prefs', shell.task([
  'dconf reset -f /org/gnome/shell/extensions/gravatar/',
]));

gulp.task('uninstall', cb => del([paths.install], { force: true }, cb));

gulp.task('install-link', gulp.series('uninstall', 'build', () => gulp.src(['build']).pipe(symlink(paths.install))));

gulp.task('install', gulp.series('uninstall', 'build', () => gulp.src(['build/**/*']).pipe(gulp.dest(paths.install))));

gulp.task('require-clean-wd', (cb) => {
  const count = execSync('git status --porcelain | wc -l').toString().replace(/\n$/, '');
  if (parseInt(count, 10) !== 0) {
    return cb(new Error('There are uncommited changes in the working directory. Aborting.'));
  }
  return cb();
});

gulp.task('bump', (cb) => {
  let version;
  const stream = gulp.src(paths.metadata)
    .pipe(jsonEditor((json) => {
      version = json.version + 1;
      return Object.assign({}, json, { version });
    }, { end_with_newline: true }))
    .pipe(gulp.dest('src'));
  stream.on('error', cb);
  stream.on('end', () => {
    execSync('git commit src/metadata.json -m "Bump version"');
    execSync(`git tag v${version}`);
    return cb();
  });
});

gulp.task('push', (cb) => {
  execSync('git push origin');
  execSync('git push origin --tags');
  return cb();
});

gulp.task('dist', gulp.series('lint', 'build', (cb) => {
  const zipFile = `${metadata.uuid}-${getVersion(true)}.zip`;
  const stream = gulp.src(['build/**/*'])
    .pipe(zip(zipFile))
    .pipe(gulp.dest('dist'));
  stream.on('error', cb);
  stream.on('end', cb);
}));

gulp.task('release', gulp.series('lint', 'require-clean-wd', 'bump', 'push', 'dist'));

gulp.task('enable-debug', shell.task([
  'dconf write /org/gnome/shell/extensions/gravatar/debug true',
]));

gulp.task('disable-debug', shell.task([
  'dconf write /org/gnome/shell/extensions/gravatar/debug false',
]));

gulp.task('test', gulp.series('lint'));

gulp.task('default', (cb) => {
  /* eslint-disable no-console */
  console.log(
    '\n'
    + 'Usage: gulp [COMMAND]\n'
    + '\n'
    + 'Commands\n'
    + '\n'
    + 'TEST\n'
    + '  lint                  Lint source files\n'
    + '  test                  Runs the test suite\n'
    + '\n'
    + 'BUILD\n'
    + '  clean                 Cleans the build directory\n'
    + '  build                 Builds the extension\n'
    + '  watch                 Builds and watches the src directory for changes\n'
    + '\n'
    + 'INSTALL\n'
    + '  install               Installs the extension to\n'
    + '                        ~/.local/share/gnome-shell/extensions/\n'
    + '  install-link          Installs as symlink to build directory\n'
    + '  uninstall             Uninstalls the extension\n'
    + '  reset-prefs           Resets extension preferences\n'
    + '\n'
    + 'PACKAGE\n'
    + '  dist                  Builds and packages the extension\n'
    + '  release               Bumps/tags version and builds package\n'
    + '\n'
    + 'DEBUG\n'
    + '  enable-debug          Enables debug mode\n'
    + '  disable-debug         Disables debug mode\n',
  );
  /* eslint-enable no-console */
  return cb();
});
