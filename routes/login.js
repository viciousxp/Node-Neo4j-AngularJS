var passport = require('passport')
  , User = require('../models/User')
  , database = require('./database')
  , crypto = require('crypto');


exports.logout = function(req, res) {
  req.logout();
  res.send(200);
};

exports.login = function(req, res, next) {
  console.info('INFO>>> ' + JSON.stringify(req.body))
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      console.info(err);
      return next(err);
    }
    if (!user) {
      console.info("103");
      console.info(info);
      return res.send(401, { "message": info.message });
    }else if(!user.verifiedPass){
      console.info("104");
      return res.send(401, { "message": info.message });
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

exports.register = function (req, res, next) {
    var emailVerification = crypto.randomBytes(32).toString('hex');
    loginOps.create({
        username: req.body['username'],
        email: req.body['email'],
        password: req.body['password'],
        emailVerification: emailVerification,
        verified: false
    }, function (err, user) {
        if (err) return next(err);
        req._forceLogIn(user, function(err) {
            if (err) return next(err);
            res.redirect('/users/' + user.username);
        })
    });
};

exports.authenticate = function (username, password, callback) {
  database.getIndexedNodes('users', 'username', username, function (err, nodes) {
    if (err) return callback(err);
    if (nodes.length === 0) return callback(null, false);
    user = new User(nodes[0]);
    var shasum = crypto.createHash('sha1');
    shasum.update(password);
    input_pass = shasum.digest('hex');
    console.info('user.password=> ' + user.password);
    console.info('input_pass=> ' + input_pass);
    if(user.password == input_pass){
      user.verifiedPass = true;
      return callback(null, user);
    }else{
      user.verifiedPass = false;
      return callback(null, user);
    }
  });
};