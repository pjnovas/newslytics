var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Social Counter' });
});

router.get('/login', login);
router.get('/logout', logout);

/* GET dashboard page. */
router.get('/dashboard', checkAuth, function(req, res, next) {
  res.render('dashboard', { title: 'Social Counter - Dashboard' });
});

require('./counter')(router);

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

module.exports = router;
