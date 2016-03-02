'use strict';

const extname = require('gulp-extname');
const assemble = require('assemble');
const app = assemble();
const map = require('map-stream');
const vinylYamlData = require('vinyl-yaml-data');
let Handlebars = require('engine-handlebars');
require('handlebars-helpers')({ handlebars: Handlebars.Handlebars });

const sourceFiles = {
  partials: 'src/templates/partials/*.hbs',
  layouts: 'src/templates/layouts/*.hbs',
  pages: 'src/templates/pages/*.hbs',
  yml: 'src/data/**/*.yml',
  json: 'src/data/**/*.json'
}


app.engine('hbs', Handlebars);
app.create('pages');

app.helper('markdown', require('helper-markdown'));
app.helper('log', function(val) {
  console.log(val);
});

app.task('load', function(cb) {
  app.partials(sourceFiles.partials);
  app.layouts(sourceFiles.layouts);
  app.pages(sourceFiles.pages);
  cb();
});

app.task('loadYAML', function(cb) {
  const addYAML = function(data, cb) {
    app.data(data);
    cb(null, data);
  };
  return app.src(sourceFiles.yml).pipe(vinylYamlData()).pipe(map(addYAML));
});

app.task('loadJSON', function(cb) {
  const addJSON = function(data, cb) {
    let jsonData = {};
    jsonData[data.stem] = JSON.parse(data.content);
    app.data(jsonData);
    cb(null, data);
  };
  return app.src(sourceFiles.json).pipe(map(addJSON));
});

app.task('default', ['loadJSON', 'loadYAML', 'load'], function() {
    return app.toStream('pages')
      .on('error', console.log)
      .pipe(app.renderFile('md'))
      .on('error', console.log)
      .pipe(extname())
      .pipe(app.dest('build'));
});

module.exports = app;
