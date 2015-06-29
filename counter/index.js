
var request = require('request');
var async = require('async');
var networks = require('./networks');
var ga = require('./ga');
var config = require('../config.json');

var networkList = [
  'facebook',
  'linkedin',
  'twitter',
  'googleplus'
];

function getFetcher(url, network){

  return function(cb){

    var req = networks.fetcher[network](url);

    request(req, function(error, response, body){
      if (!error && response.statusCode == 200) {
        return cb(null, networks.parser[network](body));
      }

      cb(error || body);
    });

  };

}

module.exports = {

  get: function(url, done, skipGA){

    var fetchers = {};

    networkList.forEach(function(network){
      fetchers[network] = getFetcher(url, network);
    });

    if (skipGA){
      async.parallel(fetchers, done);
      return;
    }

    // attach google analytics
    fetchers.googleanalytics = function(cb){

      ga.getData(url, function(error, data){
        if (error) {
          console.log('ERROR on GA Fetch: ' + error.message);
          return cb();
        }

        cb(null, ga.parse(data));
      });
    };

    async.parallel(fetchers, done);
  },

  getAll: function(urls, done){

    var fetchers = [];
    var self = this;

    urls.forEach(function(data){

      fetchers.push( (function(_data){

        return function(cb){
          self.get(_data.url, function(err, counters){
            _data.counters = counters;
            cb(err, _data);
          });
        };

      })(data) );

    });

    async.parallel(fetchers, done);

  },

  getTop: function(max, done){
    var self = this;
    var domain = config.rss.origin.replace(/\/\s*$/, ''); //remove last '/'

    ga.getTop(max, function(error, data){

      if (error) {
        console.log('ERROR on GA Fetch: ' + error.message);
        return done(new Error('Error at Google Analytics Fetch'));
      }

      var gaData = ga.parseEach(data);

      var fetchers = [];

      gaData.forEach(function(data){

        fetchers.push( (function(_data){

          return function(cb){
            self.get(domain + _data.url, function(err, counters){

              _data.tail = _data.url;
              _data.url = domain + _data.tail;
              _data.counters = counters;
              _data.counters.googleanalytics = {
                total: _data.total,
                details: _data.details
              };

              delete _data.total;
              delete _data.details;

              cb(err, _data);

            }, true);
          };

        })(data) );

      });

      async.parallel(fetchers, function(err, networks){
        console.dir(networks);
        done(err, networks);
      });

    });

  },

};
