let preprocessor = 'sass'; 

const { src, dest, parallel, series, watch } = require('gulp');

const browserSync  = require('browser-sync').create();
const bssi         = require('browsersync-ssi');
const buildssi     = require('gulp-ssi');
const concat 			 = require('gulp-concat');
const uglify 			 = require('gulp-uglify-es').default;
const webpack      = require('webpack-stream');
const sass 				 = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleancss 		 = require('gulp-clean-css');
const rename       = require('gulp-rename');
const del       	 = require('del');

function browsersync() {
	browserSync.init({
		server: {
			baseDir: 'app/',
			middleware: bssi({ baseDir: 'app/', ext: '.html' })
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
	// tunnel: 'yousutename', // Attempt to use the URL https://yousutename.loca.lt
})
}

function scripts() {
	return src(['app/js/index.js', '!app/js/*.min.js'])
	.pipe(webpack({
		mode: 'production',
		performance: { hints: false },
		module: {
			rules: [
			{
				test: /\.(js)$/,
				exclude: /(node_modules)/,
				loader: 'babel-loader',
				query: {
					presets: ['@babel/env'],
					plugins: ['babel-plugin-root-import']
				}
			}
			]
		}
	})).on('error', function handleError() {
		this.emit('end')
	})
	.pipe(rename('all.min.js'))
	.pipe(dest('app/js'))
	.pipe(browserSync.stream())
}

function styles() {
	return src('app/' + preprocessor + '/style.' + preprocessor + '')
	.pipe(eval(preprocessor)())
	.pipe(concat('style.min.css'))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true }))
.pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } ))
.pipe(dest('app/css/'))
.pipe(browserSync.stream())
}

function startwatch() {
	watch(['app/**/*.js', '!app/**/*.min.js'], scripts);
	watch('app/**/' + preprocessor + '/**/*', styles);
	watch('app/**/*.html').on('change', browserSync.reload);
}

function buildcopy() {
	return src([
		'{app/js,app/css}/*.min.*',
		'app/img/**/*',
		'app/fonts/**/*'
	], { base: 'app' })
	.pipe(dest('dist'))
}

function buildhtml() {
	return src(['app/**/*.html', '!app/parts/**/*'])
	.pipe(buildssi({ root: 'app/' }))
	.pipe(dest('dist'))
}


function cleandist() {
	return del('dist/**/*', { force: true })
}

exports.browsersync = browsersync;
exports.scripts 		= scripts;
exports.styles 			= styles;

exports.build 			= series(cleandist, scripts, styles, buildcopy, buildhtml);

exports.default = parallel(styles, scripts, browsersync, startwatch);
