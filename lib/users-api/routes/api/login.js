var passport = require('passport')
  , User = require('../../models/User')
  , functions = require('../../../../routes/functions')
  , database = require('../../../../routes/database')
  , crypto = require('crypto')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474')
  , http = require('http')
  , req = http.IncomingMessage.prototype;

/*****
    Authentication Functions
        *****/

exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401);
}

exports.isSelf = function (req, res, next) {
  var user = req.user;
  if (user.username === req.params.id) req.isSelf = true;
  else req.isSelf = false;
  return next();
}

exports.ensureIsSelf = function (req, res, next) {
  if (req.isSelf) return next();
  res.send(401);
}

exports.logout = function(req, res) {
  req.logout();
  res.send(200);
};

exports.login = function(req, res, next) {
  console.info('INFO>>> ' + JSON.stringify(req.body))
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.info(err);
      res.send(500, {err: err});
    }
    if (!user) {
      console.info("103");
      console.info(info);
      return res.send(401, { err: info.message });
    }else if(!user.verifiedPass){
      console.info("104");
      return res.send(401, { err: info.message });
    }else if (user.verifiedPass) {
      var serializeUser = {};
      serializeUser.username = user.username;
      serializeUser.password = user.password; 
      req.logIn(serializeUser, function(err) {
        if (err) { 
          console.info(err);
          return next(err); 
        } else {
          res.send(200, {user: user.username});
        }
      });
    }
  })(req, res, next);
};

exports.userStatus = function(req, res) {
  var user = req.user;
  res.send(user.username);
}

exports.register = function (req, res, next) {
    var emailVerification = crypto.randomBytes(32).toString('hex'),
        password = crypto.createHash('sha1').update(req.body.password).digest('hex'),
        data = {
            username: req.body.username,
            email: req.body.email,
            password: password,
            emailVerification: emailVerification,
            verified: false
        },
        node = db.createNode(data);

    database.getIndexedNodes('users', 'username', data.username, function(err, returnedNode) {
        if (err) return res.send(500, {err: 'Server Error'});
        else if (returnedNode.length > 0) return res.send(409, {err: 'User Exists'});
        node.save(function (err) {
            if (err) return res.send(500, {err: 'Server Error'});
            node.index('users', 'username', data.username, function (err) {
                if (err) res.send(500, {err: 'Server Error'});
                req._forceLogIn(data, function(err) {
                    if (err) res.send(500, {err: 'Server Error: Could not log you in automatically, please login manually'});
                    var user = new User(node)
                    user.verifyEmail();
                    res.send(201, {msg: 'Registration successful'})
                })
            });
        });
    });
};

exports.isEmailVerified = function(req, res) {
  var user = req.user;
  if (user.verified !== true) return res.send(200, {result: false});
  res.send(200, {result: true});
}

exports.verifyEmail = function(req, res) {
  database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
    if (err) return res.send(500, {msg: err, result: false});
    if (nodes.length === 0) return res.send(500, {msg: 'User not found', result: false});
    var user = new User(nodes[0]);
    console.log(JSON.stringify(req.body))
    console.log(user.emailVerification)
    if (req.body.token === user.emailVerification) {
      if (user.verified === true) return res.send(200, {msg: 'You have already verified your email', result: false});
      user.verified = true
      user.save(function (err) {
          if (err) return res.send(500, {err: 'Server Error'});
          res.send(200, {result: true});
      });
    } else {
      res.send(200, {result: false});
    }
  });
}

exports.authenticate = function (username, password, callback) {
  database.getIndexedNodes('users', 'username', username, function (err, nodes) {
    if (err) return callback(err);
    if (nodes.length === 0) return callback(null, false);
    user = new User(nodes[0]);
    var shasum = crypto.createHash('sha1');
    shasum.update(password);
    input_pass = shasum.digest('hex');
    if(user.password == input_pass){
      user.verifiedPass = true;
      return callback(null, user);
    }else{
      user.verifiedPass = false;
      return callback(null, user);
    }
  });
};

exports.sendPasswordReset = function(req, res) {
    database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        user.passwordReset = crypto.randomBytes(32).toString('hex');
        user.save(function (err) {
            console.log('err=> ' + err);
            if (err) return res.send(500, {msg: 'Server Error'});
            user.sendPasswordReset();
            res.send(200, {msg: 'Password reset sent to email on file'});
        });        
    });
}

exports.resetPassword = function(req, res) {
    database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        if (req.body.token === user.passwordReset) {
            var password = crypto.createHash('sha1').update(req.body.password).digest('hex');
            user.password = password;
            user.save(function (err) {
                if (err) return res.send(500, {msg: 'Server Error'});
                res.send(200, {msg: 'Password reset, please login'});
            });
        } else {
          res.send(401, {msg: 'Unauthorized password reset request or invalid token'});
        }
    });
}

exports.getData = function(req, res) {
  var user = req.user;
  user.getData(function(err, data) {
    if (err) return res.send(500, {msg: err});
    //res.send(200, data);
    console.log(JSON.stringify(data));
  });
}

//override for req.login in passport to avoid hitting the database in situations
//where we want to login the user without asking for their password or in situations
//where we want to login the user but neo4j's index has not been updated yet.
req._forceLogIn = function(user, options, done) {
  if (!this._passport) throw new Error('passport.initialize() middleware not in use');
  
  if (!done && typeof options === 'function') {
    done = options;
    options = {};
  }
  options = options || {};
  var property = this._passport.instance._userProperty || 'user';
  var session = (options.session === undefined) ? true : options.session;
  
  this[property] = user;
  if (session) {
    var self = this;
    var obj = {};
    obj.username = user.username;
    obj.password = user.password;
    self._passport.session.user = obj;
    done();
  } else {
    done && done();
  }
}