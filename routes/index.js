
var express = require('express');

module.exports = function(config){
  var router = express.Router();

  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Newslytic' });
  });

  router.get('/login', login);
  router.get('/logout', logout);

  router.get('/dashboard', checkAuth, function(req, res, next) {
    res.render('dash', { title: 'Dashboard - Newslytic' });
  });

  router.use('/suscribe', require('./suscribe')(config));

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
    return res.redirect('/dashboard');
  }

  res.render('login');
}

function logout(req, res) {
  req.logout();
  res.redirect('/');
}
