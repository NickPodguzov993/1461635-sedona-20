const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const sync = require("browser-sync").create();
const csso = require("gulp-csso");
const rename = require("gulp-rename");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const del = require("del");

// Styles

const styles = () => {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename({suffix: ".min"}))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(sync.stream())
}

exports.styles = styles;

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: "build"
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Watcher

const watcher = () => {
  gulp.watch("source/sass/**/*.scss", gulp.series("styles"));
  gulp.watch("source/.html").on("change", gulp.series(copy, sync.reload));
}

exports.default = gulp.series(
  styles, server, watcher
);

const images = () => {
  return gulp.src(["source/img//*{jpg,png,svg}", "!source/img//icon-*.svg"])
     .pipe(imagemin([
          imagemin.optipng({optizationLevel: 3}),
          imagemin.mozjpeg({progressive: true}),
          imagemin.svgo()
          ]))
     .pipe(gulp.dest("build/img"))
}

const webpg = () => {
  return gulp.src("build/img/**/*.{png,jpg}")
     .pipe(webp({quality: 90}))
     .pipe(gulp.dest("build/img"))
}

exports.webp = webp;

const sprite = () => {
  return gulp.src("source/img/**/icon-*.svg")
     .pipe(imagemin([
    imagemin.svgo({
        plugins: [
            {removeAttrs: { attrs: ["fill"] }}]})
                 ]))
     .pipe(svgstore())
     .pipe(rename("sprite.svg"))
     .pipe(gulp.dest("build/img"))
}

exports.sprite = sprite;

const copy = () => {
  return gulp.src([
     "source/fonts/**/*.{woff,woff2}",
     "source/*.ico",
     "source/*.html"
    ], {
       base: "source"
      })
  .pipe(gulp.dest("build"));
};

exports.copy = copy;

const clean = () => {
  return del("build");
};

const build = gulp.series(
    clean,
    gulp.parallel(styles,copy,images,sprite),
    webpg
  );

exports.build = build;

exports.default = gulp.series(
build,
gulp.parallel(server, watcher)
);
