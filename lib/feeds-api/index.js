var express = require('express')
  , app = module.exports = express()
  , database = require('../../routes/database')
  , api = require('./routes');

var usersAPI = require('../users-api/routes');

//comments
app.post('/api/feeds/comments/:postId',
    usersAPI.login.ensureAuthenticated,
    api.comments.postComment
);
app.put('/api/feeds/comments/:commentId',
    usersAPI.login.ensureAuthenticated,
    api.comments.updateComment
);
app.delete('/api/feeds/comments/:commentId',
    usersAPI.login.ensureAuthenticated,
    api.comments.deleteComment
);

//feeds
app.get('/api/feeds/feeds/:offset?/:limit?/:orderBy?',
    api.feeds.listPublicFeeds
);
app.get('/api/feeds/:id/:offset?/:limit?/:orderBy?',
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.feeds.listUserFeeds
);


app.post('/api/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, usersAPI.login.ensureIsSelf, api.feeds.create);
app.get('/api/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, api.feeds.getFeed);
app.delete('/api/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, usersAPI.login.ensureIsSelf, api.feeds.delete);

app.get('/api/feeds/:id/:feedName/subscription', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, api.subscriptions.getSubscriptions);
app.post('/api/feeds/:id/:feedName/:subscription', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, usersAPI.login.ensureIsSelf, api.subscriptions.postToSubscription)

//Subscriptions API