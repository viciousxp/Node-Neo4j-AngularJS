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
app.get('/api/feeds/getAllFeeds/:offset?/:limit?/:orderBy?',
    api.feeds.listPublicFeeds
);
app.get('/api/feeds/getUserFeeds/:id/:offset?/:limit?/:orderBy?',
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.feeds.listUserFeeds
);


app.post('/api/feeds/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, usersAPI.login.ensureIsSelf, api.feeds.create);
app.get('/api/feeds/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, api.feeds.getFeed);
app.delete('/api/feeds/feeds/:id/:feedName', usersAPI.login.ensureAuthenticated, usersAPI.login.isSelf, usersAPI.login.ensureIsSelf, api.feeds.delete);

app.get('/api/feeds/feeds/:id/:feedName/subscriptions', 
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.subscriptions.getSubscriptions
);

//Subscriptions API
app.post('/api/feeds/subscriptions/:feedName/:subscription',
    usersAPI.login.ensureAuthenticated,
    api.subscriptions.createSubscription
);

app.get('/api/feeds/subscriptions/getAllSubscriptions/:offset?/:limit?/:orderBy?',
    usersAPI.login.ensureAuthenticated,
    api.subscriptions.listPublicSubscriptions
);

app.get('/api/feeds/subscriptions/getUserSubscriptions/:id/:offset?/:limit?/:orderBy?',
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.subscriptions.listUserSubscriptions
);

app.get('/api/feeds/subscriptions/getFeedSubscriptions/:id/:feedId/:offset?/:limit?/:orderBy?',
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.subscriptions.listFeedSubscriptions
);

app.get('/api/feeds/subscriptions/getSubscriptionPosts/:id/:subscriptionId',
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.subscriptions.listSubscriptionPosts
);

// Posts API

app.post('/api/feeds/posts/:id/:feedName/:subscription', 
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    usersAPI.login.ensureIsSelf,
    api.subscriptions.postToSubscription
);

app.get('/api/feeds/posts/:id/:postId', 
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.posts.getSinglePost
);

app.delete('/api/feeds/posts/:id/:postId', 
    usersAPI.login.ensureAuthenticated,
    usersAPI.login.isSelf,
    api.posts.deletePost
);