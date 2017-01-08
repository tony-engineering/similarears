var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Queue = require('bee-queue');
var redis = require("redis");

var calculation = require('./routes/calculation');

var app = express();

// Queue init
var client = redis.createClient();

// BE-Queue UI
var beequeueui = require('bee-queue-ui/app')({
    redis: {
      host: '127.0.0.1',
      port: '6379'
    }
  });
app.use('/bee-queue-ui', function(req, res, next){
  req.basepath = '/bee-queue-ui';
  res.locals.basepath = '/bee-queue-ui';
  next();
}, beequeueui );
app.listen(9000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/calculation', calculation);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
