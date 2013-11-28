var express = require('express')
  , app = module.exports = express()
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisStore = require('connect-redis')(express)
  , RedisDB = require('redis')
  , database = require('../../routes/database')
  , api = require('./routes')
  , User = require('./models/User');

app.configure(function() {
  app.use(express.logger('dev'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  // Redis will store sessions
  app.use(express.session( { store: new RedisStore(), secret: 'keyboard cat', cookie: { secure: false, maxAge:86400000 } } ));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended). 
}); 

/*****
    User Management API Routes
        *****/

/*****
    Passport Configs
        *****/

passport.serializeUser(function(user, done) {
  done(null, user);
}); 

passport.deserializeUser(function(user, done) {
  database.getIndexedNodes('users', 'username', user.username, function (err, users) {
    if (err) return next(err);
    user = new User(users[0]);
    done(err, user);
  });
}); 

passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password'},
  function(username, password, done) {
    process.nextTick(function() {
      api.login.authenticate(username, password, function (error, user) {
        if (error) {
          return done(error);
        } else {
          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }else if(!user.verifiedPass){
            return done(null, user, { message: 'Invalid password' });
          }
          return done(null, user);            
        }
      });
    });
  }
));

exports.ensureAuthenticated = api.login.ensureAuthenticated;

//users api
app.post('/api/users/login', api.login.login);
app.get('/api/users/status', api.login.ensureAuthenticated, api.login.userStatus);
app.get('/api/users/logout', api.login.logout);
app.post('/api/users/sendPasswordReset/:id', api.login.sendPasswordReset);
app.post('/api/users/passwordReset/:id', api.login.resetPassword);
app.get('/api/users/isEmailVerified/:id', api.login.ensureAuthenticated, api.login.isSelf, api.login.ensureIsSelf, api.login.isEmailVerified);
app.post('/api/users/verifyEmail/:id', api.login.verifyEmail);
app.post('/api/users/register', api.login.register);
app.get('/api/users/search', api.login.ensureAuthenticated, api.search.search)

//prof
app.get('/api/users/getProfile', api.login.ensureAuthenticated, api.login.isSelf, api.login.getData)
app.post('/api/users/profile/:id', api.login.ensureAuthenticated, api.login.isSelf, api.login.ensureIsSelf, api.profile.update);
app.get('/api/users/profile/:id', api.login.ensureAuthenticated, api.login.isSelf, api.profile.get);