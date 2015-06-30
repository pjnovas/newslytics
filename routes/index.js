
var express = require('express');

module.exports = function(config){
  var router = express.Router();

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'newslytics' });
  });

  router.get('/login', login);
  router.get('/logout', logout);

  /* GET dashboard page. */
  router.get('/dashboard.old', checkAuth, function(req, res, next) {
    res.render('dashboard', { title: 'newslytics - Dashboard' });
  });

  /* GET new dashboard page. */
  router.get('/dashboard', checkAuth, function(req, res, next) {
    res.render('dash', { title: 'newslytics - Dashboard' });
  });

  /* GET reports page. */
  router.get('/reports', checkAuth, function(req, res, next) {
    res.render('reports', { title: 'newslytics - Reports' });
  });

  router.use('/api', require('./articles')(config));
  router.use('/api', require('./reports')(config));

  return router;
};

function checkAuth(req, res, next){
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  next();
}

function login(req, res) {
  if (req.isAuthenticated()){
    return res.redirect('/');
  }

  res.render('login');
}

function logout(req, res) {
  req.logout();
  res.redirect('/');
}
