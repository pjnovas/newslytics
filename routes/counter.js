
var jf = require('jsonfile')
  , countersPath = global.appRoot + '/rssfeed/counters.json'
  , moment = require("moment");

var counter = require('../counter');
var rssFeed = require('../rssfeed');

module.exports = function(router) {
  router.get('/counts', isAuth, getByUrl);
  router.get('/rss_counts', isAuth, getCache, checkAndUpdate, sendCounters);
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

