
var fs = require('fs');
var path = require('path');

var express = require('express');
var app = express();

var basePath = path.resolve(__dirname);
var router = express.Router();

function sendFile(filename, res){
  fs.readFile(filename, 'utf8', function(err, data) {
    if (err) throw err;
    res.send(data);
  });
}

router.get('/', function(req, res){

  if (!req.query.hasOwnProperty('feed')){
    res.status(500).send('EXPECTED feed=rss2 parameter');
    return;
  }

  if (!req.query.hasOwnProperty('year')){
    sendFile(basePath + '/feed_5.xml', res);
    return;
  }

  sendFile(basePath + '/search_feed.xml', res);
});

router.get('/2013/12/happiness/', function(req, res){

  if (!req.query.hasOwnProperty('feed')){
    res.status(500).send('EXPECTED feed=rss2 parameter');
    return;
  }

  sendFile(basePath + '/single_feed.xml', res);
});

app.use('/', router);

var http = require('http');

var port = process.env.PORT || '3100';
app.set('port', port);
var server = http.createServer(app);

server.listen(port);

server.on('error', function(){
  throw error;
  process.exit(1);
});

server.on('listening', function(){
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

  console.log('Express server listening on port ' + server.address().port);
});
