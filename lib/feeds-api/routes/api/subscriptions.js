var User = require('../../../users-api/models/User')
  , Feed = require('../../models/Feed')
  , Subscription = require('../../models/Subscription')
  , Post = require('../../models/Post')
  , database = require('../../../../routes/database')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

exports.getSubscriptions = function (req, res) {
    var user, feed, subscriptions;
    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
        if (err) return res.send(500, err);
        if (nodes.length === 0) return res.send(404, 'User not found');
        user = new User(nodes[0]);
        fetchSubscriptions(user);
        });
    } else {
        user = req.user;
        fetchSubscriptions(user);
    }

    function fetchSubscriptions(user) {
        user.getFeed(req.params.feedName, function(err, feed) {
            if (err) return res.send(500, {err: 'Server Error'});
            if (typeof feed === 'undefined') return res.send(500, {err: 'Cannot find feed'});
            else {
                feed = new Feed(feed[0]['nodes']);
                feed.getSubscriptions(function(err, subscriptions) {
                    if (err) return res.send(500, {err: 'Server Error'});
                    if (typeof subscriptions === 'undefined') return res.send(500, {err: 'Cannot get subscriptions at the moment'});
                    else res.send(200, {subscriptions: subscriptions});
                });
            }
        });
    }
}

exports.postToSubscription = function (req, res) {
    var user = req.user,
        feed = req.params.feedName,
        subscription = req.params.subscription,
        postText = req.body.postText,
        date = new Date();


    user.getFeed(feed, function(err, feed) {
        if (err) return res.send(500, {err: 'Server Error'});
        if (typeof feed === 'undefined' || feed === null) return res.send(500, {err: 'Cannot find feed'});
        else {
            feed = new Feed(feed[0]['nodes']);
            feed.getSubscription(subscription, function(err, subscription) {
                console.log(err)
                if (err) return res.send(500, {err: 'Server Error'});
                if (typeof subscription === 'undefined' || subscription === null) return res.send(500, {err: 'Cannot find subscription'});
                else {
                    subscription = new Subscription(subscription[0]['nodes']);
                    
                    var data = {
                            author: user.username,
                            body: postText,
                            date: date
                        },
                        post = db.createNode(data);

                    post.save(function (err) {
                        if (err) return res.send(500, {err: 'Server Error'});
                        post = new Post(post);
                        subscription.addPost(post, function(err) {
                            if (err) return res.send(500, {msg: 'Server Error'});
                            else {
                                var data = {
                                    subscriptionName: subscription.subscriptionName,
                                    id: post.id,
                                    author: post.author,
                                    body: post.body,
                                    date: post.date,
                                    comments: []
                                }
                                res.send(200, {post: data});
                            }
                        });
                    });
                }
            });
        }
    });
}