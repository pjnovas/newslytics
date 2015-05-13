
var request = require('request');
var async = require('async');
var networks = require('./networks');
var ga = require('./ga');

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

  get: function(url, done){

    var fetchers = {};

    networkList.forEach(function(network){
      fetchers[network] = getFetcher(url, network);
    });

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
  }

};
