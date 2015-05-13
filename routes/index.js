var express = require('express');
var router = express.Router();

var counter = require('../counter');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Social Counter' });
});

/* GET dashboard page. */
router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { title: 'Social Counter - Dashboard' });
});

/* GET Counts by url */
router.get('/counts', function(req, res, next) {
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

module.exports = router;
