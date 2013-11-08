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
    if(user.password == input_pass){
      user.verifiedPass = true;
      return callback(null, user);
    }else{
      user.verifiedPass = false;
      return callback(null, user);
    }
  });
};

exports.getFollowing = function(req, res) {
  var user;
  if (!req.isSelf) {
    console.log('getting new user')
    database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        fetchRelationships(user);
    });
  } else {
    user = req.user;
    fetchRelationships(user);
  }
  function fetchRelationships(user) {
    //async func required otherwise if !req.isSelf we will require the user before we fetch new
    //user from DB.
    user.getIncomingRelationships('follows', function(err, nodes) {
      if (err) return res.send(500, {msg: 'Server Error'});
      users = nodes.map(function (node) {
          var user = new User(node['nodes']);
          return {'username': user.username};
      });   
      res.json(users);
    })
  }
}

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

exports.getFollowed = function(req, res) {
  var user;
  if (!req.isSelf) {
    database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        fetchRelationships(user);
    });
  } else {
    user = req.user;
    fetchRelationships(user);
  }
  function fetchRelationships(user) {
    user.getOutgoingRelationships('follows', function(err, nodes) {
      if (err) return res.send(500, {msg: 'Server Error'});
      users = nodes.map(function (node) {
          var user = new User(node['nodes']);
          return {'username': user.username};
      });   
      res.json(users);
    })
  }
}

exports.getData = function(req, res) {
  var user = req.user;
  user.getData(function(err, data) {
    if (err) return res.send(500, {msg: err});
    //res.send(200, data);
    console.log(JSON.stringify(data));
  });
}