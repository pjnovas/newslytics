
var debug = require('debug')('social-counter:router');

var jf = require('jsonfile')
  , countersPath = global.appRoot + '/rssfeed/counters.json'
  , moment = require("moment")
  , async = require("async")

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

  //router.get('/counts', isAuth, getByUrl);
  //router.get('/rss_counts', isAuth, getCache, checkAndUpdate, sendCounters);

  router.get('/articles', fetchRSS, map, cache, send);
  router.get('/articles/*', parseURL, fetchRSS, map, cache, sendOne);

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

  function throwError(err){
    if (err) {
      console.log(err, err.stack);
      res.status(500).send(err);
      return true;
    }
  }

  if (req.articleUrl){
    // One article by url

    rssFeed.get(req.articleUrl, function(err, article){
      if (throwError(err)) return;
      req.article = article;
      next();
    });

    return;
  }

  var search = req.query;

  if (!search || _.isEmpty(search)){
    // No search query > get last 10 RSS feed

    rssFeed.getFeed(function(err, result){
      if (throwError(err)) return;
      req.articles = result.items;
      next();
    });

    return;
  }

  // Get by a search
  rssFeed.search(search, function(err, result){
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

        var article = new Article(_article);

        scraper.scrape(_article.url, function(err, result){
          if (err) {
            console.log(err);
          }
          else if (result) {
            article.title = result.title || article.title;
            article.text = result.text;
            article.readtime = result.readtime;
          }

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
    return storeOne(req.article, function(article){
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

function send(req, res){
  res.send(req.articles || []);
}

function sendOne(req, res){
  res.send(req.article);
}


/************************************************************************/


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
