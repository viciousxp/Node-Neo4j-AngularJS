var User = require('../../../users-api/models/User')
  , Feed = require('../../models/Feed')
  , Subscription = require('../../models/Subscription')
  , Post = require('../../models/Post')
  , database = require('../../../../routes/database')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

exports.createSubscription = function (req, res) {
    var user = req.user,
        subscriptionFeed = (typeof req.params.feedName !== 'undefined') ? req.params.feedName : null,
        subscriptionName = (typeof req.params.subscription !== 'undefined') ? req.params.subscription : null,
        subscriptionType = (typeof req.body.subscriptionType !== 'undefined') ? req.body.subscriptionType : null,
        subscriptionInfo = (typeof req.body.subscriptionInfo !== 'undefined') ? req.body.subscriptionInfo : null,
        public = (typeof req.body.public !== 'undefined') ? req.body.public : null,
        data = {
            subscriptionName: subscriptionName,
            type: subscriptionType,
            infos: subscriptionInfo,
            public: public
        },
        newSubscription = db.createNode(data);

    if (subscriptionFeed === null || subscriptionName === null || subscriptionType === null || subscriptionInfo === null || public === null) return res.send(500, {err: 'missing infos'});

    database.getIndexedNodes('subscriptions', 'subscriptionName', data.subscriptionName, function(err, results) {
        if (err) return res.send(500, {err: 'Server Error'});
        if (typeof results === 'undefined' || results === null) res.send(500, {err: 'subscription exists'});
        else {
            database.getNodeById(subscriptionFeed, function(err, node) {
                if (err) return res.send(404, {err: 'feed not found and is required'});
                var feed = new Feed(node);
                newSubscription.save(function (err) {
                    if (err) return res.send(500, {err: err});
                    newSubscription.index('subscriptions', 'subscriptionName', data.subscriptionName, function (err) {
                        if (err) res.send(500, {err: 'Server Error'});
                    console.log(err)

                        newSubscription = new Subscription(newSubscription);
                        feed.addRelationship(newSubscription, 'has_subscription', {}, function(err) {
                            if (err) return res.send(500, {err: 'Server Error'});
                            user.addRelationship(newSubscription, 'owns_subscription', {}, function(err) {
                                if (err) return res.send(500, {err: 'Server Error'});
                                res.send(200, {
                                    subscription: {
                                        name: newSubscription.subscriptionName,
                                        id: newSubscription.id
                                    },
                                    owner: {
                                        username: user.username
                                    }
                                });
                            });
                        });
                    });
                });
            });
        }
    });
}

exports.listPublicSubscriptions = function (req, res) {
    var user = (typeof req.user !== 'undefined') ? req.user : null,
        offset = (typeof req.params.offset !== 'undefined') ? req.params.offset : 0,
        limit = (typeof req.params.limit !== 'undefined') ? req.params.limit : 50,
        orderBy = (typeof req.params.orderBy !== 'undefined') ? req.params.orderBy : null;

    database.listPublicSubscriptions(user, offset, limit, orderBy, function (err, subscriptions) {
        if (err) return res.send(500, {err: 'Server Error'});
        if (typeof subscriptions === 'undefined' || subscriptions === null) return res.send(404, {msg: 'Nothing found'});
        var subscriptions = subscriptions.map(function (subscription) {
            return {subscriptionName: subscription.subscription.subscriptionName, subscriptionOwner: subscription.owner.username};
        });
        res.send(200, subscriptions);
    });
}

exports.listUserSubscriptions = function (req, res) {
    var user,
        offset = (typeof req.params.offset !== 'undefined') ? req.params.offset : 0,
        limit = (typeof req.params.limit !== 'undefined') ? req.params.limit : 50,
        orderBy = (typeof req.params.orderBy !== 'undefined') ? req.params.orderBy : null,
        isSelf = false;
    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
            if (err) return res.send(500, err);
            if (nodes.length === 0) return res.send(404, 'User not found');
            user = new User(nodes[0]);
            fetchSubscriptions(user);
        });
    } else {
        user = req.user;
        isSelf = true;
        fetchSubscriptions(user);
    }

    function fetchSubscriptions(user) {
        database.listUserSubscriptions(user, isSelf, offset, limit, orderBy, function (err, subscriptions) {
            if (err) return res.send(500, {err: 'Server Error'});
            if (typeof subscriptions === 'undefined' || subscriptions === null) return res.send(404, {msg: 'Nothing found'});
            subscriptions = subscriptions.map(function (subscription) {
                return {
                    name: subscription.subscription.subscriptionName,
                    public: subscription.subscription.public,
                    subscriptionId: subscription.subscription.id,
                    Owner:  subscription.subscriptionOwner.username
                };
            });
            res.send(200, subscriptions);
        });
    }
}

exports.listFeedSubscriptions = function(req, res) {
    var user,
        feedId = req.params.feedId,
        offset = (typeof req.params.offset !== 'undefined') ? req.params.offset : 0,
        limit = (typeof req.params.limit !== 'undefined') ? req.params.limit : 50,
        orderBy = (typeof req.params.orderBy !== 'undefined') ? req.params.orderBy : null,
        isSelf = false;
    if (!req.isSelf) fetchSubscriptions();
    else {
        isSelf = true;
        fetchSubscriptions();
    }

    function fetchSubscriptions() {
        database.listFeedSubscriptions(feedId, isSelf, offset, limit, orderBy, function (err, subscriptions) {
            if (err) return res.send(500, {err: 'Server Error'});
            if (typeof subscriptions === 'undefined' || subscriptions === null) return res.send(404, {msg: 'Nothing found'});
            subscriptions = subscriptions.map(function (subscription) {
                return {
                    name: subscription.subscription.subscriptionName,
                    public: subscription.subscription.public,
                    subscriptionId: subscription.subscription.id,
                    Owner:  subscription.subscriptionOwner.username
                };
            });
            res.send(200, subscriptions);
        });
    }
};

exports.listSubscriptionPosts = function (req, res) {
    var user,
        subscriptionId = (typeof req.params.subscriptionId !== 'undefined') ? req.params.subscriptionId : null,
        isSelf = false;
    if (!req.isSelf) fetchSubscription();
    else {
        isSelf = true;
        fetchSubscription();
    }

    function fetchSubscription() {
        database.listSubscriptionPosts(subscriptionId, isSelf, function (err, subscription, subscriptionOwner, feeds, posts) {
            if (err) return res.send(500, {err: 'Server Error'});
            if (typeof subscription === 'undefined' || subscription === null) return res.send(404, {msg: 'Nothing found'});
            console.log('subscription: ' + subscription.subscriptionName)
            console.log('subscriptionOwner: ' + subscriptionOwner.username)
            console.log('feeds: ' + feeds[0].feedName)
            posts.map(function(post) {
                console.log('post: ' + post.post.body)
                post.comments.map(function(comment) {
                    console.log('comment: ' + comment.body)
                });
            });

            // var subscriptionMeta = {
            //     name: subscription.subscription.subscriptionName,
            //     public: subscription.subscription.public,
            //     subscriptionId: subscription.subscription.id,
            //     Owner:  subscription.subscriptionOwner.username
            // }

            // subscription = subscriptionPosts.map(function(subscription) {

            // });
            // res.send(200, {subscriptionMeta: subscriptionMeta, subscription: subscription});
        });
    }
}

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
    console.log('posted')
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
                        subscription.addPost(user, post, function(err) {
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