
var feed = require("feed-read");
var config = require("../config.json");
var xmlreader = require('xmlreader');
var request = require('request');

module.exports = {

  get: function(urls, done){
    var url = urls[0] + config.rss.append;

    request(url, function(error, response, body){
      if (!error && response.statusCode == 200) {
        var xmlreader = require('xmlreader');

        xmlreader.read(body, function (err, res){
          if(err) return console.log(err);

          var art = res.rss.channel;
          done(null, {
            title: art.title.text(),
            url: art.link.text()
          });
        });

        return;
      }

      done(error || body);
    });

  },

  getLastFeed: function(done){

    feed(config.rss.url, function(err, articles) {
      if (err) return done(err);

      var urls = articles.map(function(article){
        return {
          title: article.title,
          published: article.published,
          url: article.link
        };
      });

      done(null, urls || []);

    });
  },

  search: function(query, done){
    //query.date.year
    //query.date.month
    //query.date.day
    //query.keywords


  }

};


