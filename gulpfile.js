'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');
var unused = require('gulp-unused');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

//var gulp_babel = require("gulp-babel");
//var gulp_sourcemaps = require("gulp-sourcemaps");
var derequire = require('gulp-derequire');

//var glob = require('glob');
//var util = require("gulp-util");

//var es = require('event-stream');
//var path = require('path');
var clean = require('gulp-clean');

var strip_line = require('gulp-strip-line');

var uglify = require('gulp-uglify');

var gutil = require('gulp-util')

gulp.task('coverage', ['eslint'], function() {
  return gulp.src(['index.js', 'lib/**/*.js'])
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

/*
const BABEL_CONFIG = {
  "plugins": [
    "external-helpers",
    "add-module-exports"
  ],
  "babelrc": false,
  "moduleIds": false
};
*/

gulp.task('clean', function() {
  return gulp.src(['./tmp', './dist'], { read: false })
  .pipe(clean());
});

//gulp.task('copy-lib-for-browserify', ['clean'], function() {
//  return gulp.src(['./lib/**/*.js','!./lib/fs.js','!./lib/path.js', '!./lib/fs.js'])
//  .pipe(gulp.dest('./tmp/lib'));
//});

gulp.task('copy-files-for-browserify', ['clean'], function() {
  return gulp.src([
    './index.js',
    './lib/**/*.js',
    '!./lib/fs.js',
    '!./lib/path.js',
    '!./lib/code.js',
    '!./lib/html.js',
    '!./lib/i18n.js',
    '!./lib/markdown.js',
    '!./lib/match.js',
    '!./lib/date.js'
  ], {base: '.'})
  .pipe(strip_line(
    [
      /fs: require\('.\/fs'\)/,
      /path: require\('.\/path'\)/,
      /code: require\('.\/code'\)/,
      /i18n: require\('.\/i18n'\)/,
      /markdown: require\('.\/markdown'\)/,
      /match: require\('.\/match'\)/,
      /date: require\('.\/date'\)/
    ]))
  .pipe(gulp.dest('./tmp/'));
});

gulp.task('prepare-for-browserify', ['copy-files-for-browserify'], function() {

});


gulp.task('browserify', ['prepare-for-browserify'], function() {

  var b = browserify({
    standalone: 'index',
    entries: './tmp/index.js',
    debug: false,
    // Tell browserify that commonly available modules are already available
    external: [
      'Handlebars',
      'moment',
      'date.js'
    ]
  });

  // ignore the internal handlebars require
  b.ignore('handlebars');
  b.ignore('moment');
  b.ignore('date.js');

  return b.bundle()
  .pipe(source('index.js'))
  .pipe(derequire())
  .pipe(buffer())
  .pipe(uglify())
  .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString(), err.fileName); })
  .pipe(gulp.dest('./dist/browserify/'));

});

gulp.task('mocha', ['coverage'], function() {
  return gulp.src('test/{integration/,}*.js')
    .pipe(mocha({reporter: 'spec'}))
    .pipe(istanbul.writeReports())
    .pipe(istanbul.writeReports({
      reporters: [ 'text', 'text-summary' ],
      reportOpts: {dir: 'coverage', file: 'summary.txt'}
    }));
});

gulp.task('eslint', function() {
  return gulp.src(['*.js', 'lib/**/*.js', 'test/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('unused', function() {
  var utils = require('./lib/utils');
  return gulp.src(['index.js', 'lib/**/*.js'])
    .pipe(unused({keys: Object.keys(utils)}));
});

gulp.task('default', ['mocha']);
