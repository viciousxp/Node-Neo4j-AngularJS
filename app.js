var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisStore = require('connect-redis')(express)
  , RedisDB = require('redis')
  , database = require('./routes/database')
  , routes = require('./routes')
  , api = require('./routes/api')
  , login = require('./routes/login')
  , User = require('./models/User');

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
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
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }
}); 

/*****
    Passport Configs
        *****/

passport.serializeUser(function(user, done) {
  done(null, user);
}); 

passport.deserializeUser(function(user, done) {
  database.getIndexedNodes('users', 'username', user.username, function (err, users) {
    console.info('err=> ' + err);
    if (err) return next(err);
    user = new User(users[0]);
    done(err, user);
  });
}); 

passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password'},
  function(username, password, done) {
    console.info('username=> ' + username);
    console.info('password=> ' + password);
    process.nextTick(function() {
      login.authenticate(username, password, function (error, user) {
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

/*****
    Authentication Functions
        *****/

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401);
}

function isSelf(req, res, next) {
  user = req.user;
  if (user.username === req.params.id) req.isSelf = true;
  else req.isSelf = false;
  return next();
}

function ensureIsSelf(req, res, next) {
  if (req.isSelf) res.send(200, {user: req.user.username});
  else res.send(401);
}


/*****
    Angular Routes
        *****/

app.get('/', routes.index);
app.get('/partial/:name', routes.partial);

/*****
    ReST API
        *****/

app.get('/api/name', api.name);
app.get('/api/listMenu', api.listMenu);

/*****
    Login Functions
        *****/
app.post('/api/users/login', login.login);
app.get('/api/users/status/:id', ensureAuthenticated, isSelf, ensureIsSelf);
app.get('/api/users/logout', login.logout);
app.post('/api/users/register', login.register);

/*****
    Return Index for All Uncaught Routes
        *****/

//app.all('/*', routes.index);

/*****
    Start Server
        *****/

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});