
/*
 * RequestJS Parameters for each Network request
 */

module.exports = {

  facebook: function(url){
    return {
      json: true,
      url: 'https://api.facebook.com/method/links.getStats?format=json&urls=' + url
    };
  },

  linkedin: function(url){
    return {
      json: true,
      url: 'https://www.linkedin.com/countserv/count/share?format=json&url=' + url
    };
  },

  twitter: function(url){
    return {
      json: true,
      //'http://cdn.api.twitter.com/1/urls/count.json?url=' + url
      url: 'http://urls.api.twitter.com/1/urls/count.json?url=' + url
    };
  },

  googleplus: function(url){
    return {
      json: true,
      // key is fixed by Google to get +1 counts
      url: 'https://clients6.google.com/rpc?key=AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ',
      method: 'POST',
      body: [{
        method: 'pos.plusones.get',
        id: 'p',
        jsonrpc: '2.0',
        key: 'p',
        apiVersion: 'v1',
        params: {
          nolog: true,
          id: url,
          source: 'widget',
          userId: '@viewer',
          groupId: '@self'
        }
      }]

    };
  },

};

/*
TODO:

Reddit:http://buttons.reddit.com/button_info.json?url={{url}}
Digg: http://widgets.digg.com/buttons/count?url={{url}}
Delicious: http://feeds.delicious.com/v2/json/urlinfo/data?url={{url}}
StumbleUpon: http://www.stumbleupon.com/services/1.01/badge.getinfo?url={{url}}
Pinterest: http://widgets.pinterest.com/v1/urls/count.json?source=6&url={{url}}

*/
