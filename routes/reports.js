
var moment = require('moment')
  , ga = require('../counter/ga')
  , express = require('express')
  , mongoose = require('mongoose');

var Article = mongoose.model('Article');

module.exports = function(config) {
  var router = express.Router();

  if (process.env.NODE_ENV != "test"){
    router.use(isAuth);
  }

  router.get('/reports/weekly', setDates, gaTotalWeekly, gaTopTenWeekly, setArticles, send);

  return router;
};

function isAuth(req, res, next){
  if (!req.isAuthenticated()){
    return res.status(401).send("User not authenticated");
  }

  next();
}

function setDates(req, res, next){
  req.dates = {
    a: {},
    b: {}
  };

  // Week before
  req.dates.a.from = moment(req.query.fromA) || moment().weekday(-14); // monday before
  req.dates.a.to = moment(req.query.toA) || moment().weekday(-7); // sunday before

  // This Week
  req.dates.b.from = moment(req.query.fromB) || moment().weekday(0); // monday
  req.dates.b.to = moment(req.query.toB) || moment().weekday(7); // sunday

  console.dir(req.dates);
  next();
}

function gaTotalWeekly(req, res, next){

  ga.getTotalByPeriod({
    dateA: req.dates.a,
    dateB: req.dates.b,
  }, function(err, data){
    if (err) {
      console.dir(err);
      return res.sendStatus(500);
    }

    req.weeklyTotals = data;
    next();
  });
}

function gaTopTenWeekly(req, res, next){

  ga.getTopByPeriod({
    dateA: req.dates.a,
    dateB: req.dates.b,
    max: 10
  }, function(error, posts){

    req.articles = [];

    function getPost(url){
      var found;
      req.articles.forEach(function(article){
        if (article.url === url){
          found = article;
          return false; // break loop
        }
      });

      return found;
    }

    function setPostTotal(name){
      posts[name].forEach(function(post){

        var p = getPost(post.url);
        if (!p){
          p = { url: post.url };
          req.articles.push(p);
        }

        p[name] = post.total;
      });

    }

    setPostTotal('dateA');
    setPostTotal('dateB');

    next();
  });
}

function setArticles(req, res, next){

  var urls = req.articles.map(function(article){
    return article.url;
  });

  Article.find({ tail: { $in: urls } }, function(err, articles){
    if (err) {
      console.dir(err);
      return res.sendStatus(500);
    }

    var filled = [];
    articles.forEach(function(found){
      var _article = found.toJSON();

      req.articles.forEach(function(a){
        if (_article.tail === a.url){
          _article.ga = a;
        }
      });

      filled.push(_article);
    });

    req.articles = filled;
    next();
  });

}

function send(req, res){
  res.send({
    totals: req.weeklyTotals,
    articles: req.articles
  });
}