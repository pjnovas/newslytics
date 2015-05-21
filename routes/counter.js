
var debug = require('debug')('social-counter:router');

var jf = require('jsonfile')
  , countersPath = global.appRoot + '/rssfeed/counters.json'
  , moment = require("moment")
  , _ = require("lodash")
  , mongoose = require('mongoose');

var Article = mongoose.model('Article');

var counter = require('../counter');
var rssFeed = require('../rssfeed');

module.exports = function(router) {
  //router.get('/counts', isAuth, getByUrl);
  //router.get('/rss_counts', isAuth, getCache, checkAndUpdate, sendCounters);

  router.get('/counts', isAuth, setUrls, setArticles, fetchNewArticles);
};

/* GET Counts by url */
function getByUrl(req, res, next) {
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
}

function setUrls(req, res, next) {
  req.articleURLs =
    (req.query.urls && req.query.urls.split(',')) ||
    [ req.query.url ];

  if (!req.articleURLs || !req.articleURLs.length){
    return res.status(400).send('url or urls parameter expected');
  }

  next();
}

function setArticles(req, res, next){

  // Articles
  //1. get articles from DB

  Article.find({ url: { $in: req.articleURLs } }, function(err, articles){
    if (err) {
      debug('Error on fetching Articles', err);
      return res.status(500).send(err.message);
    }

    req.articles = articles || [];

    req.newArticlesURLs = _.difference(
      req.articleURLs,
      req.articles.map(function(article){ return article.url; })
    );

    next();
  });

  // Feed
  //2. get and store new articles (not found on db) using feed
  // url = url + config.rss.append;
  //3. Scrappe content and store text

  // GA
  //4. get googleAnalytics cache for each article
  //5. fetch old and non existant ones (more than 1 Day or not found)

  // Social
  //6. Get social Cache for each url
  //7. fetch old and non existant ones (more than 1 Hour or not found)
}

function fetchNewArticles(req, res, next){

  if (!req.newArticlesURLs || !req.newArticlesURLs.length){
    // no new urls to fetch
    return next();
  }

  rssFeed.get(req.newArticlesURLs, function(err, articles){
    if (err) {
      debug('Error on fetching NEW RSSFeed Articles', err);
      return res.status(500).send(err.message);
    }

    console.dir(articles);
    res.send(200);
    return;

    Article.create(articles, function(err, newArticles){
      if (err) {
        debug('Error on creating NEW RSSFeed Articles', err);
        return res.status(500).send(err.message);
      }

      //TODO: Scrap text of new articles and update TEXT property

      req.articles = req.articles.concat(newArticles || []);
      next();
    });

  });
}

function setGoogleAnalytics(req, res, next){
  /*
  counter.getAll(
    req.articles.map(function(article){ return article.url; })
  );
  */
}

function setSocial(req, res, next){
  /*
  counter.getAll(
    req.articles.map(function(article){ return article.url; })
  );
  */
}

function getCache(req, res, next){

  jf.readFile(countersPath, function(err, obj) {
    if (err){
      console.log(err);
      obj = { timestamp: 0, data: [] };
    }

    res.counters = obj;
    next();
  });

}

function checkAndUpdate(req, res, next){

  var today = moment().format("DD-MM-YYYY HH");
  var datetime = moment.unix(res.counters.timestamp);

  if (datetime.format("DD-MM-YYYY HH") === today){
    next();
    return;
  }

  function SaveAndContinue(newObj){
    jf.writeFile(countersPath, newObj, function(err){
      if (err){
        console.log(err);
        next();
        return;
      }

      res.counters = newObj;
      next();
    });
  }

  rssFeed.get(function(error, urls){
    if (error) {
      console.dir(error);
      return res.status(500).send(error);
    }

    counter.getAll(urls, function(error, countList){
      if (error) {
        console.dir(error);
        return res.status(500).send(error);
      }

      SaveAndContinue({
        timestamp: moment().unix(),
        data: countList
      });

    });
  });

}

function sendCounters(req, res){
  res.send(res.counters);
}

function isAuth(req, res, next){

  if (!req.isAuthenticated()){
    return res.send(401, "User not authenticated");
  }

  next();
}

