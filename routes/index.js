var express = require('express');
var router = express.Router();

var counter = require('../counter');

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

/* GET Counts by url */
router.get('/counts', isAuth, function(req, res, next) {
  var url = req.query.url;

  if (!url){
    return res.status(400).send('URL parameter expected');
  }

  counter.get(url, function(error, counts){
    if (error) {
      console.dir(error);
      return res.status(500).send(error);
    }
    res.send(counts);
  });

});

function isAuth(req, res, next){

  if (!req.isAuthenticated()){
    return res.send(401, "User not authenticated");
  }

  next();
};

function checkAuth(req, res, next){
  if (!req.isAuthenticated()){
    return res.redirect("/login");
  }

  next();
};

function login(req, res) {
  if (req.isAuthenticated()){
    return res.redirect('/');
  }

  res.render('login');
};

function logout(req, res) {
  req.logout();
  res.redirect('/');
};

module.exports = router;
