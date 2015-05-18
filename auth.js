
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;

module.exports = function(app, config) {

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login'
    })
  );

  // Hardcode auth for now
  passport.use(new LocalStrategy(function(username, password, done) {
    process.nextTick(function() {

      if (process.env.NODE_ENV == "test"){
        return done(null, { username: "test", password: "test" });
      }

      if (username === config.auth.user && password === config.auth.pass ){
        return done(null, { username: username, password: password });
      }

      done(null, false);
    });

  }));

};

