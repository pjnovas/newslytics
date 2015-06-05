
var debug = require('debug')('social-counter:router');

var async = require("async")

  , express = require('express')
  , nURL = require('url')
  , _ = require("lodash")
  , mongoose = require('mongoose');

var Article = mongoose.model('Article');

var counter = require('../counter');
var rssFeed = require('../rssfeed');
var scraper = require('../scraper');

module.exports = function(config) {
  rssFeed.configure(config.rss);
  scraper.configure(config.scraper);

  var router = express.Router();

  if (process.env.NODE_ENV != "test"){
    router.use(isAuth);
  }

  router.get('/articles', fetchRSS, map, cache, ga, social, send);
  router.get('/articles/*', parseURL, fetchRSS, map, cache, ga, social, sendOne);

  return router;
};

function isAuth(req, res, next){
  if (!req.isAuthenticated()){
    return res.status(401).send("User not authenticated");
  }

  next();
}

function parseURL(req, res, next){
  var url = req.url.replace('/articles/', '');
  var purl = nURL.parse(url);

  if (!purl.host || !purl.protocol){
    return res.status(400).send('invalid url > ' + url);
  }

  req.articleUrl = url;
  next();
}

function fetchRSS(req, res, next){
  console.log('fetchRSS > ');

  function throwError(err){
    if (err) {
      console.log(err, err.stack);
      res.status(500).send(err);
      return true;
    }
  }

  if (req.articleUrl){
    // One article by url
    console.log('fetchRSS > ONE ARTICLE ' + req.articleUrl);
    rssFeed.get(req.articleUrl, function(err, article){
      if (err){
        console.log("ERROR ON RSS FETCH ONE");
        console.dir(err);
      }
      if (throwError(err)) return;
      req.article = article;
      next();
    });

    return;
  }

  var search = req.query;

  if (!search || _.isEmpty(search)){
    // No search query > get last 10 RSS feed
    console.log('fetchRSS > GET FEED ');
    rssFeed.getFeed(function(err, result){
      console.log('fetchRSS > GET FEED > DONE ');
      if (throwError(err)) return;
      req.articles = result.items;
      next();
    });

    return;
  }

  console.log('fetchRSS > SEARCH FEED', search);
  // Get by a search
  rssFeed.search(search, function(err, result){
    console.log('fetchRSS > SEARCH FEED > DONE ');
    if (throwError(err)) return;
    req.articles = result.items;
    next();
  });

}

function map(req, res, next){

  if (req.article){
    var lnk = req.article.meta.link;

    req.article = {
        url: lnk
      , tail: (lnk && nURL.parse(lnk).pathname) || ''
      , title: req.article.meta.title || ""
      , comments: req.article.items.length
      , fetched_at: new Date()
    };

    return next();
  }

  function map(obj){
    return {
        url: obj.link
      , tail: (obj.link && nURL.parse(obj.link).pathname) || ''
      , title: obj.title || ""
      , published_at: obj.pubDate
      , comments: +((obj['slash:comments'] && obj['slash:comments']['#']) || 0)
      , text: ""
      , fetched_at: new Date()
    };
  }

  if (req.articles && req.articles.length){
    req.articles = req.articles.map(map);
  }

  next();
}

function cache(req, res, next){
  console.log('cache: ARTICLES > ');

  function onError(err){
    if (err) {
      console.log(err, err.stack);
      return true;
    }
  }

  function storeOne(_article, done){
    // Updates cache for one article (creates one if no exist)

    Article.findOne({ url: _article.url }, function(err, article){
      if (onError(err)) return done();

      if (!article){
        // article not cached, create one
        console.log('cache: NEW ARTICLE ');

        var article = new Article(_article);

        console.log('cache: Scrape ARTICLE ' + _article.url);
        scraper.scrape(_article.url, function(err, result){
          console.log('cache: Scraped ARTICLE ');
          if (err) {
            console.log(err);
          }
          else if (result) {
            article.title = result.title || article.title;
            article.text = result.text;
            article.readtime = result.readtime;
          }

          console.log('cache: Scraped ARTICLE result ');
          console.dir(result);

          article.save(function(err, article){
            if (onError(err)) return done();
            done(article);
          });

        });

        return;
      }

      // article cached > update it
      article.comments = _article.comments;
      article.fetched_at = _article.fetched_at || new Date();

      article.save(function(err, article){
        if (onError(err)) return done();
        done(article);
      });

    });
  }

  if (req.article){
    // only one article fetch
    console.log('cache: only one article fetch ');
    return storeOne(req.article, function(article){
      console.log('cache: STORED ');
      req.article = article || req.article;
      next();
    });
  }

  if (req.articles && req.articles.length){
    // multiple articles fetch
    var stores = [];

    stores = req.articles.map(function(article){

      return function(cb){
        storeOne(article, function(newArticle){
          cb(null, newArticle || article);
        });
      };

    });

    async.series(stores, function(err, articles){
      if (onError(err)) return next();
      req.articles = articles;
      next();
    });

    return;
  }

  next();
}

function ga(req, res, next){
  if (process.env.NODE_ENV == "test"){
    return next();
  }

  //TODO: Cache
  //TODO: get GA separated

  next();
}

function social(req, res, next){
  if (process.env.NODE_ENV == "test"){
    return next();
  }

  //TODO: Cache

  if (req.article){
    console.log('social: ONE ARTICLE > ');

    counter.get(req.article.url, function(error, count){
      if (error) {
        console.dir(error);
        return res.status(500).send(error);
      }

      console.log('ONE ARTICLE COUNTERS > ');
      console.dir(count);
      req.article = req.article.toJSON();
      req.article.counters = count;
      next();
    });

    return;
  }

  if (req.articles && req.articles.length > 0){
    var toFill = req.articles.map(function(article){
      return article.toJSON();
    });

    console.log('PRE > filling articles COUNTERS');
    console.dir(toFill);

    counter.getAll(toFill, function(error, filled){
      if (error) {
        console.dir(error);
        return res.status(500).send(error);
      }

      console.log('filling articles COUNTERS');
      console.dir(filled);

      req.articles = filled;
      console.log('filled articles > ' + filled.length);

      next();
    });

    return;
  }

  next();
}

function send(req, res){
  res.send(req.articles || []);
}

function sendOne(req, res){
  console.log('SENDING ONE ARTICLE > ');
  console.dir(req.article);
  res.send(req.article);
}
