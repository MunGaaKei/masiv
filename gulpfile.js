const gulp = require('gulp');
const minify = require('gulp-minify-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');

gulp.task('css', () => {
	
	return gulp.src('css/masiv.css')
		.pipe(minify())
		.pipe(concat('masiv.min.css'))
		.pipe(gulp.dest('lib'));

});

gulp.task('js', () => {
	return gulp.src('js/masiv.js')
		.pipe(concat('masiv.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('lib'));
});

gulp.task('plugin', () => {
	return gulp.src('js/plugins/*.js')
		.pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
		.pipe(gulp.dest('lib/plugins'));
});

gulp.task('default', gulp.series('css', 'js', 'plugin'));