
var moment = require('moment')
  , ga = require('../counter/ga')
  , express = require('express')
  , mongoose = require('mongoose')
  , nodemailer = require('nodemailer');

var Suscriptor = mongoose.model('Suscriptor');
var transport;
var emailEnabled = false;
var emailCfg;

module.exports = function(config) {
  var router = express.Router();

  emailCfg = config.email;
  emailEnabled = config.email && config.email.enabled || false;
  if (emailEnabled){
    transport = nodemailer.createTransport(config.email.transport);
  }

  router.post('/', validate, store, sendEmail, sendOK);

  return router;
};

function isValidEmail(email){
  var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
  return re.test(email);
}

function validate(req, res, next){
  var name = req.body.name;
  var email = req.body.email;

  if (!name || !name.length){
    res.status(400).send({ error: 'Name is required' });
    return;
  }

  if (!email || !email.length || !isValidEmail(email)){
    res.status(400).send({ error: 'Email is required and must be valid' });
    return;
  }

  req.suscriptor = { name: name, email: email };

  next();
}

function store(req, res, next){

  Suscriptor.findOne({ email: req.suscriptor.email }, function(err, suscriptor){
    if (err) {
      console.dir(err);
      return res.status(500).send({ error: 'error on fetching suscribers' });
    }

    if (suscriptor){
      return res.status(409).send({ error: 'email has already suscribed' });
    }

    Suscriptor.create(req.suscriptor, function(err, suscriptor){
      if (err) {
        console.dir(err);
        console.dir(req.suscriptor);
        return res.status(500).send({ error: 'error on creating suscriber' });
      }

      req.suscriptor = suscriptor;

      next();
    });

  });

}

function sendEmail(req, res, next){

  if (!emailEnabled){
    return next();
  }

  var mailOpts = {
    from: emailCfg.suscribers.sendAs,
    to: emailCfg.suscribers.sendTo,
    subject: 'New Suscriber - Newslytic',
    text : 'Name: ' + req.suscriptor.name + ' \n Email: ' + req.suscriptor.email,
    html : 'Name: ' + req.suscriptor.name + ' <br/> Email: ' + req.suscriptor.email
  };

  transport.sendMail(mailOpts, function (err, response) {
    if (err) {
      console.dir(err);
      console.dir(req.suscriptor);
      return res.status(500).send({ error: 'error on sending suscribing' });
    }

    req.suscriptor.email_sent_at = Date.now();
    req.suscriptor.save(function(err){
      next();
    });

  });
}

function sendOK(req, res){
  res.render('index', {
    title: 'Newslytic'
  });
}
