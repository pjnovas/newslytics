
var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

module.exports = function(){

  var Article = new Schema(require('./Article'));
  var GoogleAnalytics = new Schema(require('./GoogleAnalytics'));
  var SocialCount = new Schema(require('./SocialCount'));
  var Suscriptor = new Schema(require('./Suscriptor'));

  mongoose.model('Article', Article);
  mongoose.model('GoogleAnalytics', GoogleAnalytics);
  mongoose.model('SocialCount', SocialCount);
  mongoose.model('Suscriptor', Suscriptor);

  function preSave(next){
    this.updated_at = new Date();
    next();
  }

  Article.pre('save', preSave);
  GoogleAnalytics.pre('save', preSave);
  SocialCount.pre('save', preSave);

};
