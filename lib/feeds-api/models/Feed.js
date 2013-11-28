// file: feed.js
// Description: Feed Object subclass(Node)

var Node = require('../../../models/Node')
  , Subscription = require('./Subscription')
  , Post = require('./Post')
  , config = require('../../../config.js')
  , functions = require('../../../routes/functions')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

Feed.prototype = new Node();

Feed.prototype.constructor = Feed;

function Feed(_node) {
    this._node = _node;
}

Object.defineProperties(Feed.prototype, {
    feedName: {
        get: function () {
            return this._node.data['feedName'];
        },
        set: function (feedName) {
            this._node.data['feedName'] = feedName;
        },
        enumerable: true,
        configurable: true
    },
    public: {
        get: function () {
            return this._node.data['public'];
        },
        set: function (public) {
            this._node.data['public'] = public;
        },
        enumerable: true,
        configurable: true
    }
});

Feed.prototype.getSubscriptions = function(callback) {
    var thisFeed = this;
    thisFeed.getOutgoingRelationships('has_subscription', function (err, subscriptions) {
        if (err) return callback(err);
        if (subscriptions.length === 0 || subscriptions === null) {
            var data = {subscriptionName: 'main'},
                subscription = db.createNode(data);

            subscription.save(function (err) {
                if (err) return callback(err);
                subscription = new Subscription(subscription);
                thisFeed.addRelationship(subscription, 'has_subscription', {}, function(err) {
                    if (err) return callback(err);
                    callback(null, [{name: subscription.subscriptionName}])
                });
            });
        } else {
            subscriptions = subscriptions.map(function (subscription) {
                var subscription = new Subscription(subscription['nodes'])
                return {name: subscription.subscriptionName};
            });   
            callback(null, subscriptions)
        }
    });
}

Feed.prototype.getSubscription = function(subscriptionName, callback) {
    var query = [
        'START node=node({id})',
        'MATCH (node) -[rel:RELATIONSHIP]-> (nodes)',
        'WHERE (nodes.subscriptionName = "SUBSCRIPTION_NAME")',
        'RETURN nodes'
    ].join('\n')
        .replace('RELATIONSHIP', 'has_subscription')
        .replace('SUBSCRIPTION_NAME', subscriptionName);

    var params = {
        id: this.id,
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err, null);
        callback(null, results)
    });
}

Feed.prototype.getPosts = function(callback) {
    var query = [
        'START node=node({id})',
        'MATCH node -[:RELATIONSHIP]-> subscriptions',
        'WITH subscriptions',
        'MATCH subscriptions -[:FIRST_POST]-latestPost-[:NEXT_POST*0..50]-> nextPosts',
        'WITH nextPosts, subscriptions',
        'MATCH nextPosts -[?:FIRST_COMMENT]-latestComment-[?:NEXT_COMMENT*0..10]-> nextComments',
        'RETURN nextPosts AS posts, subscriptions AS subscriptions, COLLECT (nextComments) AS comments, nextPosts.date AS date',
        'ORDER BY nextPosts.date DESC LIMIT 50'
    ].join('\n')
        .replace('RELATIONSHIP', 'has_subscription')
        .replace('FIRST_POST', 'has_post')
        .replace('NEXT_POST', 'next_post')
        .replace('FIRST_COMMENT', 'has_comment')
        .replace('NEXT_COMMENT', 'next_comment');

    var params = {
        id: this.id,
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err, null);
        callback(null, results)
    });
}

module.exports = Feed;