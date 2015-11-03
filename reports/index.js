
var Agenda = require("agenda");
var config = require("../config.json").reports;

if (!config || !config.enabled){
  console.log("Reports not configured or disabled");
  return;
}

var db = config.db.url || ('mongodb://' + config.db.host + '/'+ config.db.name);
var agenda = new Agenda({ db: { address: db } });

if (config.daily && config.daily.enabled){
  agenda.define('daily report', config.daily.job || { priority: 'high', concurrency: 10 }, require('./daily'));
  agenda.every(config.daily.every, 'daily report');

  console.log("configured Job daily report at " + config.daily.every);
}

agenda.start();
