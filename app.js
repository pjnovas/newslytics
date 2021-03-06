var express = require('express')
  , mongoose = require('mongoose')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , session = require('express-session')
  , MongoStore = require('connect-mongo')(session)
  , passport = require('passport');

global.appRoot = path.resolve(__dirname);

var config = require('./config');
if (process.env.NODE_ENV == "test"){
  config = require('./config.test');
}

mongoose.connect(config.db.url || ('mongodb://' + config.db.host + '/'+ config.db.name));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cookieParser(config.session.secret));
app.use(session({
    secret: config.session.secret
  , store: new MongoStore({ db: config.session.db })
  , cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 /* 7 days */ }
  , resave: true
  , saveUninitialized: true
}));

app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

require('./models')();
require('./auth')(app, config);

require('./reports');

var routes = require('./routes')(config);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
