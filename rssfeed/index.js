
var feed = require("feed-read");
var config = require("../config.json");

module.exports = {

  get: function(done){

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
  }

};
