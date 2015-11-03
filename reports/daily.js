
var table = require('text-table');
var config = require("../config.json");

module.exports = function(job, done) {
  console.log('>>> Daily Report JOB - START');

  if (!config.email || !config.email.enabled){
    console.log('>>> Daily Report JOB - NOT RUN - Emails Disabled');
    return done();
  }

  require('../routes/articles').getDaily(function(err, articles){
    if (err) {
      console.log('>>> Daily Report JOB - FETCH ERROR');
      console.dir(err);
      return done();
    }

    sendEmail(articles, function(err){
      if (err) {
        console.log('>>> Daily Report JOB - EMAIL ERROR');
        console.dir(err);
      }

      console.log('>>> Daily Report JOB - END');
      done();
    });

  });

};

function sendEmail(articles, done){
  var mailOpts = {
    from: config.email.reports.daily.sendAs,
    to: config.email.reports.daily.sendTo,
    subject: 'Daily Report',
    text : getEmailBody(articles, "text"),
    html : getEmailBody(articles, "html")
  };

  console.log(mailOpts.text);
  //transport.sendMail(mailOpts, done);
}

function getEmailBody(articles, type){

  if (type === "text"){
    var data = articles.map(function(article){
      var c = article.counters;
      return [article.title, c.googleanalytics.total, c.twitter.total, c.facebook.total ]
    });

    data.unshift(['Title', 'GA', 'TW', 'FB']);
    return table(data, { align: [ 'l', 'r', 'r', 'r' ] });
  }

  return "";
}
