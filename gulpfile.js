const   gulp = require("gulp"),
        browserSync = require("browser-sync").create(),
        jshint = require("gulp-jshint"),
        concat = require("gulp-concat"),
        uglify = require("gulp-uglify"),
        babel = require("gulp-babel"),
        sourcemaps = require("gulp-sourcemaps"),
        rename = require("gulp-rename"),
        postcss = require("gulp-postcss"),
        imagemin = require("gulp-imagemin"),
        del = require("del"),
        csslint = require("gulp-csslint"),
        htmllint = require("gulp-htmllint"),
        htmlmin = require("gulp-htmlmin"),
        cleanCSS = require("gulp-clean-css"),
        postcssPlugins = [
            require("postcss-simple-vars"),
            require("postcss-cssnext")
            ];

        pep = require("../gulp-peppermint/index.js"),

        pepContext = require("./src/__Pep.json");

const paths = {
    "src": {
        "i": "src", // Stands for "initial"
        "html": ["src/**/*.html", "!src/pep_includes/**/*.*"],
        "htmlwatch": ["src/**/*.html"],
        "css": ["src/css/**/*.css"],
        "js": ["src/js/**/*.js"],
        "img": ["src/img/**/*.*"]
    },
    "build": {
        "i": "build",
        "html": "build",
        "css": "build/css",
        "js": "build/js",
        "img": "build/img"
    },
    "buildsrc": {
        "i": "build",
        "html": ["build/*.html"],
        "css": ["build/css/**/*.css"],
        "js": ["build/js/**/*.js"],
        "img": ["build/img/**/*.*"]
    },
    "dist": {
        "i": "../williams.blue",
        "html": "../williams.blue",
        "css": "../williams.blue/css",
        "js": "../williams.blue/js/",
        "img": "../williams.blue/img"
    }
};



// Default task - build project and watch for changes
gulp.task("default", gulp.series(
    gulp.parallel(
        buildHTML,
        buildCSS,
        buildJS,
        copyImg,
        // copyMiscToBuild // Uncomment if needed; otherwise gives an error if there aren"t any files to copy.
    ),
    gulp.parallel(
        watchAndRebuild,
        startBrowserSync
    )
));

// Lint html, css, js in build dir
gulp.task("lintHTML", lintHTML);
gulp.task("lintCSS", lintCSS);
gulp.task("lintJS", lintJS);

// Dist build
gulp.task("dist", gulp.series(
    cleanDist,
    gulp.parallel(
        distImg,
        // copyMiscToDist, // Uncomment if needed; otherwise gives an error if there aren"t any files to copy.
        distHTML,
        distCSS,
        distJS,
    ),
));



// BUILD ///////////////////////////////////////////////////////////////////////////////////////////
const miscFilesToCopy = [];

// Start browser sync
function startBrowserSync() {
    browserSync.init({
        server: {
            baseDir: paths.build.i
        }
    })
};

// Watch files and build on change
function watchAndRebuild() {
    const watcher =
    [   gulp.watch(paths.src.htmlwatch, buildHTML)
    ,   gulp.watch(paths.src.css, buildCSS)
    ,   gulp.watch(paths.src.js, buildJS)
    ,   gulp.watch(paths.src.img, copyImg)
    ,   gulp.watch(miscFilesToCopy, copyMiscToBuild)
    ];

    for(let each of watcher) {
        each
            .on("all", browserSync.reload)
            .on("add", path => console.log(`File ${path} was added.`))
            .on("change", path => console.log(`File ${path} changed.`))
            .on("unlink", path => console.log(`File ${path} was removed.`))
            .on("addDir", path => console.log(`Directory ${path} was added.`))
            .on("unlinkDir", path => console.log(`Directory ${path} was removed.`));
    };
};

// Build HTML
function buildHTML(done) {
    del(paths.buildsrc.html);
    return gulp.src(paths.src.html)
        .pipe(pep(pepContext))
        .pipe(gulp.dest(paths.build.html));
    done();
};

// Build CSS
function buildCSS(done) {
    del(paths.buildsrc.css);
    return gulp.src(paths.src.css)
        .pipe(sourcemaps.init())
        .pipe(postcss(postcssPlugins)) // precss, postcss-utilities, postcss-sprites, postcss-assets
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.build.css));
    done();
};

// Build JS
function buildJS(done) {
    del(paths.buildsrc.js)
    return gulp.src(paths.src.js)
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ["env"]
        }))
        //.pipe(concat("all.js"))
        .pipe(sourcemaps.write("."))
        .pipe(gulp.dest(paths.build.js))
    done()
};

// Copy images from src
function copyImg(done) {
    del(paths.buildsrc.img, { since: gulp.lastRun("default") })
    return gulp.src(paths.src.img)
        .pipe(gulp.dest(paths.build.img))
    done()
};

// Copy miscellaneous files to build
function copyMiscToBuild(done) {
    return gulp.src(miscFilesToCopy)
        .pipe(gulp.dest(paths.build.i))
    done()
};

// LINT ////////////////////////////////////////////////////////////////////////////////////////////

// Lint HTML
function lintHTML(done) {
    return gulp.src(paths.buildsrc.html)
        .pipe(htmllint())
    done()
};

// Lint CSS
function lintCSS(done) {
    return gulp.src(paths.buildsrc.css)
        .pipe(csslint())
        .pipe(csslint.formatter())
    done()
};

// Lint JS
function lintJS(done) {
    return gulp.src(paths.buildsrc.js)
        .pipe(jshint())
        .pipe(jshint.reporter("default"))
    done()
};

// DIST ////////////////////////////////////////////////////////////////////////////////////////////

// Clean dist directory
function cleanDist(done) {
    let d = paths.dist.i
    // You can use multiple globbing patterns as you would with `gulp.src`
    // If you are using del 2.0 or above, return its promise
    return del([
        `${d}/*`,
        `!${d}/.git`,
        `!${d}/.gitignore`,
        `!${d}/.nojekyll`,
        `!${d}/CNAME`,
        `!${d}/README.md`
    ], {
        "force": true
    }).then(paths => {
        console.log('Deleted files in dist dir:\n', paths.join('\n'))
    })
    done();
};

// Optimize images
function distImg(done) {
  return gulp.src(paths.src.img)
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.jpegtran({progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: true}
            ]
        })
    ]))
    .pipe(gulp.dest(paths.dist.img));
    done();
};

// Copy miscellaneous files to dist
function copyMiscToDist(done) {
    return gulp.src(miscFilesToCopy)
        .pipe(gulp.dest(paths.dist.i));
    done();
};

// Dist HTML
function distHTML(done) {
    return gulp.src(paths.src.html)
        .pipe(pep(pepContext))
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(paths.dist.html));
    done();
};

// Dist CSS
function distCSS(done) {
    return gulp.src(paths.src.css)
        .pipe(postcss(postcssPlugins))
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.dist.css));
    done();
};

// Dist JS
function distJS(done) {
    return gulp.src(paths.src.js)
        .pipe(babel({
            presets: ["env"]
        }))
        //.pipe(concat("all.js"))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dist.js));
    done();
};
