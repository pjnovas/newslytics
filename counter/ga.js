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
  , 'ga:sessionsPerUser'

  , 'ga:bounces'
  , 'ga:bouncerate'
];

var gtoken = googleToken({
  keyFile: path.dirname(__dirname) + '/ga_key.json',
  scope: scopes
});

var oauth2Client = new OAuth2();

function getOptions(done){

  gtoken.getToken(function(err, token) {
    if (err) {
      console.log("GET TOKEN ERROR: " + err);
      done(err);
      return;
    }

    oauth2Client.setCredentials({
      access_token: token
    });

    done(null, {
      'auth': oauth2Client,
      'ids': 'ga:' + config.profileID,
      'start-date': config.startDate,
      'end-date': config.endDate,
      'dimensions': 'ga:pagePath',
      'metrics': metrics.join(','),
      'sort': '-ga:pagePath',
      //'max-results': 5
    });

  });
}

function fetch(_url, done){

  getOptions(function(err, options){
    if (err) return done(err);

    if (_url){
      console.log(url.parse(_url).path);
      options.filters = 'ga:pagePath=~^*' + url.parse(_url).path;
    }

    // More info: https://developers.google.com/analytics/devguides/reporting/core/v3/reference
    analytics.data.ga.get(options, done);
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

/*
  var header = body.columnHeaders;
  var data = body.rows[0];

  header.forEach(function(col, i){
    if (col.name === 'ga:sessions'){
      result.total = +data[i];
    }

    var value = data[i];

    switch(col.dataType.toUpperCase()){
      case 'INTEGER': value = +value; break;
      case 'FLOAT':
      case 'PERCENT': value = parseFloat(value); break;
    }

    result.details[col.name.replace('ga:','')] = value;
  });
*/

  return result;
}

module.exports = {
  getData: fetch,
  parse: parse
};

