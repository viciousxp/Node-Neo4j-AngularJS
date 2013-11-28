var express = require('express')
  , app = module.exports = express()
  , api = require('./routes');

var usersAPI = require('../users-api/routes');

app.configure(function() {

}); 

/*****
    Follow Api Routes
        *****/

//follow API 
app.get('/api/users/following/:id', usersAPI.login.ensureAuthenticated, api.follow.following)
app.post('/api/users/follow/:id', usersAPI.login.ensureAuthenticated, api.follow.follow);
app.post('/api/users/unfollow/:id', usersAPI.login.ensureAuthenticated, api.follow.unfollow);
app.get('/api/users/getFollowing/:id', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, api.follow.getFollowing);
app.get('/api/users/getFollowed/:id', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, api.follow.getFollowed);