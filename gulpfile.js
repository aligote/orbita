/**
 * Created by Ольга on 28.02.2017.
 */
'use strict';

var gulp = require('gulp'),
    watch = require('gulp-watch'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    rigger = require('gulp-rigger'),
    cssmin = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    rimraf = require('rimraf'),
    compass = require('gulp-compass'),
    browserSync = require("browser-sync"),
    reload = browserSync.reload,
    svgSprite = require('gulp-svg-sprite'),
    pngSprite = require('gulp.spritesmith'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace');

var path = {
    build: {
        html: 'build/',
        js: 'build/js/',
        css: 'build/css/',
        img: 'build/images/, build/local/images/',
        svg: 'build/images/svg/sprite.svg',
        fonts: 'build/fonts/'
    },
    src: {
        html: 'src/*.html',
        js: 'src/js/main.js',
        style: 'src/styles/*.scss',
        img: 'src/images/**/*.*, src/local/images/**/*.*',
        png: 'src/png-icon/*.*',
        svg: 'src/svg-icon/**/*.svg',
        svgImages: 'src/svg-images/**/*.svg',
        fonts: 'src/fonts/**/*.*'
    },
    watch: {
        html: 'src/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/styles/**/*.scss',
        img: 'src/images/**/*.*, src/local/images/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    clean: './build'
};

var config = {
    server: {
        baseDir: "./build"
    },
    tunnel: true,
    host: 'localhost',
    port: 3000,
    logPrefix: "olga_yuzich"
};

gulp.task('webserver', function () {
    browserSync(config);
});

gulp.task('clean', function (cb) {
    rimraf(path.clean, cb);
});

gulp.task('html:build', function () {
    gulp.src(path.src.html)
        .pipe(rigger())
        .pipe(gulp.dest(path.build.html))
        .pipe(reload({stream: true}));
});

gulp.task('js:build', function () {
    gulp.src(path.src.js)
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.js))
        .pipe(reload({stream: true}));
});

gulp.task('style:build', function() {
    gulp.src(path.src.style)
        //.pipe(sourcemaps.init())
        .pipe(compass({
            config_file: 'config.rb',
            css: 'build/styles/',
            sass: 'src/styles/',
            image: 'src/images/'
        }))
        .pipe(cssmin())
        //.pipe(sourcemaps.write())
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({stream: true}));
});

gulp.task('image:build', function () {
    gulp.src(path.src.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
});

gulp.task('svgSprite:build', function () {
    return gulp.src(path.src.svg)
    // minify svg
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        // remove all fill, style and stroke declarations in out shapes
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        // cheerio plugin create unnecessary string '&gt;', so replace it.
        .pipe(replace('&gt;', '>'))
        // build svg sprite
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../sprite.svg',
                    render: {
                        scss: {
                            dest:'../../../../src/styles/_sprite.scss',
                            template: 'src/styles/templates/_sprite_template.scss'
                        }
                    }
                }
            }
        }))
        .pipe(gulp.dest('build/images/'));
});

gulp.task('pngSprite:build', function() {
    var spriteData =
        gulp.src(path.src.png) // путь, откуда берем картинки для спрайта
            .pipe(pngSprite({
                imgName: '../images/sprite.png',
                cssName: '_spritePng.scss'
            }));

    spriteData.img.pipe(gulp.dest('src/images/')); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest('src/styles/')); // путь, куда сохраняем стили
});

gulp.task('svgImages:build', function () {
    return gulp.src(path.src.svgImages)
        // build svg sprite
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../svg-images.svg'
                }
            }
        }))
        .pipe(gulp.dest('build/images/'));
});

gulp.task('build', [
    'html:build',
    'js:build',
    'style:build',
    'fonts:build',
    'image:build',
   'svgSprite:build',
    'pngSprite:build',
    'svgImages:build'
]);


gulp.task('watch', function(){
    watch([path.watch.html], function(event, cb) {
        gulp.start('html:build');
    });
    watch([path.watch.style], function(event, cb) {
        gulp.start('style:build');
    });
    watch([path.watch.js], function(event, cb) {
        gulp.start('js:build');
    });
    watch([path.watch.img], function(event, cb) {
        gulp.start('image:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts:build');
    })
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('svgSprite:build');
    });
    watch([path.watch.fonts], function(event, cb) {
        gulp.start('svgImages:build');
    });
});


gulp.task('default', ['build', 'webserver', 'watch']);
