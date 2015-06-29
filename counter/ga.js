var google = require('googleapis');
var analytics = google.analytics('v3');
var OAuth2 = google.auth.OAuth2;
var googleToken = require('gtoken');

var path = require('path');
var url = require('url');

var config = require('../config.json').googlaAnalytics;

// More info of scopes at:
// https://developers.google.com/analytics/devguides/config/mgmt/v3/mgmtAuthorization
var scopes = [
  'https://www.googleapis.com/auth/analytics.readonly',
//'https://www.googleapis.com/auth/analytics',
//'https://www.googleapis.com/auth/analytics.edit',
//'https://www.googleapis.com/auth/analytics.manage.users',
//'https://www.googleapis.com/auth/analytics.manage.users.readonly',
];

// list of metrics
// https://developers.google.com/analytics/devguides/reporting/core/dimsmets
// MAX 10 per request (limit by google)
var metrics = [
    'ga:sessions'
  , 'ga:avgSessionDuration'
  , 'ga:sessionDuration'
  //, 'ga:sessionsPerUser'
  //, 'ga:users'

  //, 'ga:bounces'
  , 'ga:bouncerate'
];

var gtoken = googleToken({
  keyFile: path.dirname(__dirname) + '/ga_key.json',
  scope: scopes
});

var oauth2Client = new OAuth2();

function getOptions(done, options){

  gtoken.getToken(function(err, token) {
    if (err) {
      console.log("GET TOKEN ERROR: " + err);
      done(err);
      return;
    }

    oauth2Client.setCredentials({
      access_token: token
    });

    var defatuls = {
      startDate: config.startDate,
      endDate: config.endDate,
      dimensions: 'ga:pagePath',
      sort: '-ga:pagePath'
    };

    options = options || {};

    done(null, {
      'auth': oauth2Client,
      'ids': 'ga:' + config.profileID,
      'start-date': options.startDate || defatuls.startDate,
      'end-date': options.startDate || defatuls.endDate,
      'dimensions': options.dimensions || defatuls.dimensions,
      'metrics': metrics.join(','),
      'sort': options.sort || defatuls.sort,
      //'max-results': 5
    });

  });
}

function fetch(_url, done){
  var exp = 'ga:pagePath=~^*';
  var maxLen = 128 - exp.length;

  getOptions(function(err, options){
    if (err) return done(err);

    if (_url){
      var urlPath = url.parse(_url).path;

      // GA: Regular expression must be less than or equal to 128 characters.
      if (urlPath.length > maxLen){
        urlPath = urlPath.substr(-maxLen);
      }

      options.filters = exp + urlPath;
    }

    // More info: https://developers.google.com/analytics/devguides/reporting/core/v3/reference
    analytics.data.ga.get(options, done);
  });
}

function fetchTop(max, done){

  getOptions(function(err, options){
    if (err) return done(err);

    options['max-results'] = (max + 5) || 10;
    analytics.data.ga.get(options, done);

  }, {
    sort: '-ga:sessions'
  });
}

function parse(body) {
  if (body.totalResults === 0){
    return { total: 0 };
  }

  var result = {
    total: +body.totalsForAllResults['ga:sessions'],
    details: body.totalsForAllResults
  };

  return result;
}

function parseEach(body) {
  if (body.totalResults === 0){
    return { total: 0 };
  }

  var header = body.columnHeaders;
  var urls = [];

  body.rows.forEach(function(value){
    var result = {
      url: '',
      total: 0,
      details: {}
    };

    header.forEach(function(col, i){

      if (col.name === 'ga:sessions'){
        result.total = +value[i];
      }

      if (col.name === 'ga:pagePath'){
        result.url = value[i];
        return;
      }

      result.details[col.name] = value[i];
    });

    if (result.url === '/') return;
    if (config.skip.some(function(part){ return result.url.indexOf(part) > -1; })) return;

    urls.push(result);
  });

  return urls;
}

module.exports = {
  getData: fetch,
  getTop: fetchTop,
  parse: parse,
  parseEach: parseEach
};

