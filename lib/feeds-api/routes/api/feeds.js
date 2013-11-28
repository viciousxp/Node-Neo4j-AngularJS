var User = require('../../../users-api/models/User')
  , Feed = require('../../models/Feed')
  , Subscription = require('../../models/Subscription')
  , Post = require('../../models/Post')
  , Comment = require('../../models/Comment')
  , database = require('../../../../routes/database')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

exports.listPublicFeeds = function (req, res) {
    var user = (typeof req.user !== 'undefined') ? req.user : null,
        offset = (typeof req.params.offset !== 'undefined') ? req.params.offset : 0,
        limit = (typeof req.params.limit !== 'undefined') ? req.params.limit : 50,
        orderBy = (typeof req.params.orderBy !== 'undefined') ? req.params.orderBy : null;

    database.listPublicFeeds(user, offset, limit, orderBy, function (err, feeds) {
        if (err) return res.send(500, {err: 'Server Error'});
        if (typeof feeds === 'undefined' || feeds === null) return res.send(404, {msg: 'Nothing found'});
        console.log('length: ' + feeds.length)
        var feeds = feeds.map(function (feed) {
            return {feedName: feed.feed.feedName, feedOwner: feed.owner.username};
        });
        res.send(200, feeds);
    });
}

exports.listUserFeeds = function(req, res) {
    var user;
    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
            if (err) return res.send(500, err);
            if (nodes.length === 0) return res.send(404, 'User not found');
            user = new User(nodes[0]);
            fetchFeeds(user);
        });
    } else {
        user = req.user;
        fetchFeeds(user);
    }

    function fetchFeeds(user) {
        user.getOutgoingRelationships('has_feed', function (err, feeds) {
            if (err) return res.send(500, {msg: 'Server Error'});
            if (feeds.length === 0 || feeds === null) {
                var data = {feedName: 'main'},
                    feed = db.createNode(data);

                feed.save(function (err) {
                    if (err) return res.send(500, {err: 'Server Error'});
                    feed = new Feed(feed);
                    user.addRelationship(feed, 'has_feed', {}, function(err) {
                        if (err) return res.send(500, {err: 'Server Error'});
                        res.send(200, {feed: feed.feedName});
                    });
                });
            } else {
                feeds = feeds.map(function (feed) {
                    var feed = new Feed(feed['nodes'])
                    console.log('getting feeds');
                    return {
                        name: feed.feedName,
                        public: feed.public
                    };
                });
                console.log('sending feeds: ' + JSON.stringify(feeds));
                res.send(200, feeds)
            }
        });
    }
}

exports.create = function(req, res) {
    var user = req.user,
        data = {
            feedName: req.params.feedName, 
            public: (typeof req.body.private !== 'undefined') ? false : true
        },
        newfeed = db.createNode(data),
        feedExists = false;

    //check if feed exists
    
    user.getOutgoingRelationships('has_feed', function (err, feeds) {
        if (err) return res.send(500, {msg: 'Server Error'});
        if (feeds !== null || feeds.length > 0) {
            for (var i = 0; i < feeds.length; i++) {
                var feed = new Feed(feeds[i]['nodes']);
                console.log('feed name: ' + feed.feedName);
                if (feed.feedName === data.feedName) feedExists = true;
            }
        }
        if (!feedExists) {
            newfeed.save(function (err) {
                if (err) return res.send(500, {err: err});
                newfeed = new Feed(newfeed);
                user.addRelationship(newfeed, 'has_feed', {}, function(err) {
                    if (err) return res.send(500, {err: 'Server Error'});
                    res.send(200, {feed: newfeed.feedName});
                });
            });
        }
    });    
}

exports.delete = function (req, res) {
    var user = req.user;
    user.getFeed(req.params.feedName, function(err, feed) {
        if (err) return res.send(500, {err: 'Server Error'});
        if (typeof feed === 'undefined') return res.send(500, {err: 'Cannot find feed'});
        else {
            feed = new Feed(feed[0]['nodes']);
            feed.deleteNode(function(err) {
                if (err) return res.send(500, {err: 'Server Error'});
                res.send(200, {msg: 'Feed Deleted'});
            });
        }
    })
}

exports.getFeed = function (req, res) {
    var user, feed, subscriptions;
    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        fetchFeed(user);
        });
    } else {
        user = req.user;
        fetchFeed(user);
    }
    //feeds are made up of multiple "subscriptions", so first we get all the subscriptions
    function fetchFeed(user) {
        user.getFeed(req.params.feedName, function(err, feed) {
            if (err) return res.send(500, {err: 'Server Error'});
            if (typeof feed === 'undefined') return res.send(500, {err: 'Cannot find feed'});
            else {
                feed = new Feed(feed[0]['nodes']);
                feed.getPosts(function(err, posts) {
                    console.log(err)
                    if (err) return res.send(500, {err: 'Server Error'});
                    else {
                        posts = posts.map(function (post) {
                            var subscription = new Subscription(post['subscriptions']),
                                thisPost = new Post(post['posts']);

                            //reverse order of comments
                            var comments = [];
                            for (var i = post['comments'].length-1; i >= 0; i--) {
                                var comment = new Comment(post['comments'][i]);
                                comments.push({
                                    id: comment.id,
                                    author: comment.author,
                                    body: comment.body,
                                    date: comment.date
                                })
                            }

                            return {
                                subscriptionName: subscription.subscriptionName,
                                id: thisPost.id,
                                author: thisPost.author,
                                body: thisPost.body,
                                date: thisPost.date,
                                comments: comments
                            };
                        });
                        res.send(200, {posts: posts});
                    } 
                });
            }
        });
    }
}