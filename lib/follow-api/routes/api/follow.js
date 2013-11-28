var User = require('../../../users-api/models/User')
  , database = require('../../../../routes/database');

/*****
    Follow Functions
        *****/

exports.following = function(req, res) {
  var user = req.user;
  user.following(req.params.id, function(err, result) {
    if (err) return res.send(500, {msg: err});
    else res.send(200, {result: result});
  });
}

exports.follow = function(req, res) {
  var user = req.user;
  database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
      if (err) return res.send(500, {msg: err});
      if (nodes.length === 0) return res.send(404, {msg: 'User not found'});
      otherUser = new User(nodes[0]);
      user.addRelationship(otherUser, 'follows', {}, function (err, rel) {
        if (err) return res.send(500, {msg: err});
        res.send(200);
      })
  });
}

exports.unfollow = function(req, res) {
  var user = req.user;
  database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
      if (err) return res.send(500, {msg: err});
      if (nodes.length === 0) return res.send(404, {msg: 'User not found'});
      otherUser = new User(nodes[0]);
      user.deleteOutgoingRelationship(otherUser, 'follows', function (err, rel) {
        if (err) return res.send(500, {msg: err});
        res.send(200);
      })
  });
}

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