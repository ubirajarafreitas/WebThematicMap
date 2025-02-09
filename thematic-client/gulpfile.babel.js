// generated on 2015-06-18 using generator-gulp-webapp 1.0.0
// segunda sincronização
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {
    stream as wiredep
}
from 'wiredep';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
    return gulp.src('app/styles/*.css')
        .pipe($.sourcemaps.init())
        .pipe($.autoprefixer({
            browsers: ['last 1 version']
        }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('.tmp/styles'))
        .pipe(reload({
            stream: true
        }));
});

function lint(files) {
    return () => {
        return gulp.src(files)
            .pipe(reload({
                stream: true,
                once: true
            }))
            .pipe($.eslint())
            .pipe($.eslint.format())
            .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
    };
}

gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js'));

gulp.task('html', ['styles'], () => {
    const assets = $.useref.assets({
        searchPath: ['.tmp', 'app', '.']
    });

    return gulp.src('app/*.html')
        .pipe(assets)
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.minifyCss({
            compatibility: '*'
        })))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.if('*.html', $.minifyHtml({
            conditionals: true,
            loose: true
        })))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('app/images/**/*')
        .pipe($.if($.if.isFile, $.cache($.imagemin({
                progressive: true,
                interlaced: true,
                // don't remove IDs from SVGs, they are often used
                // as hooks for embedding and styling
                svgoPlugins: [{
                    cleanupIDs: false
                }]
            }))
            .on('error', function(err) {
                console.log(err);
                this.end();
            })))
        .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')({
            filter: '**/*.{eot,svg,ttf,woff,woff2}'
        }).concat('app/fonts/**/*'))
        .pipe(gulp.dest('.tmp/fonts'))
        .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
    gulp.src([
        'app/assets/**/*',
    ]).pipe(gulp.dest('dist/assets'));

    return gulp.src([
        'app/*.*',
        '!app/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('copy_bower', () => {
    return gulp.src([
        'bower_components/**/*',
    ]).pipe(gulp.dest('dist/bower_components'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles', 'fonts'], () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['.tmp', 'app'],
            routes: {
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch([
        'app/*.html',
        'app/scripts/**/*.js',
        'app/images/**/*',
        '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.css', ['styles']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
    browserSync({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

gulp.task('serve:test', () => {
    browserSync({
        notify: false,
        open: false,
        port: 9000,
        ui: false,
        server: {
            baseDir: 'test'
        }
    });

    gulp.watch('test/spec/**/*.js').on('change', reload);
    gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
    gulp.src('app/*.html')
        .pipe(wiredep({
            exclude: ['bootstrap.js'],
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('app'));
});


/*
gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/** /*').pipe($.size({title: 'build', gzip: true}));
});
*/

gulp.task('build', ['html', 'images', 'fonts', 'extras', 'copy_bower'], () => {
    return gulp.src('dist/**/*').pipe($.size({
        title: 'build',
        gzip: true
    }));
});

gulp.task('default', ['clean'], () => {
    gulp.start('build');
});

gulp.task('deploy', function() {
    var config = JSON.parse(require('fs').readFileSync('./rsync.js'));

    return gulp.src(config.src)
        .pipe($.sftp({
            host: config.hostname,
            user: config.username,
            pass: config.password,
            remotePath: config.destination
        }));
});
