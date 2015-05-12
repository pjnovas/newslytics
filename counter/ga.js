var util = require('util');

var google = require('googleapis');
var analytics = google.analytics('v3');
var OAuth2 = google.auth.OAuth2;
var GoogleToken = require('gtoken');

var profileId = require('../config.json').googlaAnalytics.profileID;

// Move to config
var config = {
  google: {
    jsonKey: '../ga_key.json',
    profileId: profileId.
  }
};

// More info of scopes at:
// https://developers.google.com/analytics/devguides/config/mgmt/v3/mgmtAuthorization
var scopes = [
  'https://www.googleapis.com/auth/analytics.readonly',
//'https://www.googleapis.com/auth/analytics',
//'https://www.googleapis.com/auth/analytics.edit',
//'https://www.googleapis.com/auth/analytics.manage.users',
//'https://www.googleapis.com/auth/analytics.manage.users.readonly',
];

var gtoken = GoogleToken({
  keyFile: config.google.jsonKey,
  scope: scopes
});

gtoken.getToken(function(err, token) {
  if (err) {
    console.log("GET TOKEN ERROR: " + err);
    return;
  }

  var oauth2Client = new OAuth2();
  oauth2Client.setCredentials({
    access_token: token
  });

  var options = {
    'auth': oauth2Client,
    'ids': 'ga:' + config.google.profileId,
    'start-date': '2015-01-01',
    'end-date': '2015-05-01',
    'dimensions': 'ga:pagePath',
    'metrics': 'ga:pageviews',
    'sort': '-ga:pagePath'
  };

  analytics.data.ga.get(options, function(err, data) {
    console.log('Result: ' + (err ? err.message : 'OK'));
    console.dir(data);
  });

});
