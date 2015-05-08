
var request = require('request');
var async = require('async');
var networks = require('./networks');

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

    async.parallel(fetchers, done);
  }

};
