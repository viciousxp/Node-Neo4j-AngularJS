// file: database.js
// Description: database controller

// dependencies
var config = require('../config.js')
  , Feed = require('../lib/feeds-api/models/Feed.js')
  , Subscription = require('../lib/feeds-api/models/Subscription.js')
  , Post = require('../lib/feeds-api/models/Post.js')
  , Comment = require('../lib/feeds-api/models/Comment.js')
  , User = require('../lib/users-api/models/User.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

var database = module.exports = {}

database.unindex = function (index, property, value, callback) {
    db.unindex(index, property, value, function(err) {
        console.log(err);
        if (err) return callback(err);
        callback(null);
    })
}

database.getIndexedNodes = function (index, property, value, callback) {
    db.getIndexedNodes(index, property, value, function (err, nodes) {
        if (err) return callback(err);
        callback(null, nodes);
    });
};
 
database.getNodeById = function (id, callback) {
    db.getNodeById(id, function (err, node) {
        if (err) return callback(err);
        callback(null, node);
    });
};

database.queryNodeIndex = function (index, query, callback) {
    db.queryNodeIndex(index, query, function (err, nodes) {
        if (err) return callback(err);
        callback(null, nodes);
    });
};

database.query = function (query, params, callback) {
    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        callback(null, results);
    });
}

database.queryBuilder = function (options, callback) {
    var query = '';
    if (typeof(options) === 'function') {
        callback = options;
        options = false;
    }
    //find errors
    if (typeof(options.index) === 'undefined') {
        return callback('missing options: index');
    }
    if (typeof(options.property) === 'undefined') {
        query += '*:';
    } else {
        query += options.property + ':';
    }
    if (options.fuzzy == true) {
        if (options.query.slice(-1) !== ' ') {
            options.query = options.query.concat(' ');
        }
        options.query = options.query.replace('~','').replace(' ','~ ');
    }
    if (options.partial) {
        if (/\s/g.test(options.query)) options.query = '"' + options.query + '"';
        else options.query =  '*' + options.query.split('~').join('') + '*';
    }
    if (options.query == null) {
        query += '*';
    } else {
        query += options.query;
    }
    console.log(options.index + "=" + query)
    db.queryNodeIndex(options.index, query, function(err, nodes) {
        console.info('Err: ' + err);
        if (err) return callback(err)
        callback (null, nodes);
    });
}

database.listPublicFeeds = function (user, offset, limit, orderBy, callback) {
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '';
    var query = [
        'START feeds = node:feeds("*:*")',
        'MATCH feeds <-[:has_feed]- user',
        'WHERE HAS(feeds.public) AND feeds.public = true',
        'RETURN feeds, user',
        'ORDERBY',
        'SKIP OFFSET_VALUE',
        'LIMIT LIMIT_VALUE'
    ].join('\n')
        .replace('ORDERBY', orderBy)
        .replace('OFFSET_VALUE', offset)
        .replace('LIMIT_VALUE', limit);

    db.query(query, {}, function (err, results) {
        console.log('new err: ' + err)
        if (err) return callback(err);
        var feeds = [];
        for (var i = 0; i < results.length; i++) {
            var feed = new Feed(results[i]['feeds']),
                feedOwner = new User(results[i]['user']);
            if ((typeof feed.public !== 'undefined' && feed.public === true) ||
                (user && user.username === feedOwner.username)) {
                feeds.push({feed: feed, owner: feedOwner});
            }
        }
        callback(null, feeds);
    });
}

database.listUserFeeds = function (user, isSelf, offset, limit, orderBy, callback) {
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '',
        where = (isSelf) ? '' : 'WHERE HAS(feeds.public) AND feeds.public = true',
        query = [
        'START user = node({id})',
        'MATCH user -[:has_feed]-> feeds',
        'WHERE_VALUE',
        'RETURN feeds',
        'ORDERBY',
        'SKIP OFFSET_VALUE',
        'LIMIT LIMIT_VALUE'
    ].join('\n')
        .replace('WHERE_VALUE', where)
        .replace('ORDERBY', orderBy)
        .replace('OFFSET_VALUE', offset)
        .replace('LIMIT_VALUE', limit);

    var params = {
        id: user.id,
    };
    console.log(isSelf + ' : ' + where);
    db.query(query, params, function (err, results) {
        console.log('new err: ' + err)
        if (err) return callback(err);
        var feeds = results.map(function(feed) {
            var feed = new Feed(feed['feeds']);
            return feed;
        });
        callback(null, feeds);
    });
}

database.listPublicSubscriptions = function (user, offset, limit, orderBy, callback) {
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '';
    var query = [
        'START subscriptions = node:subscriptions("*:*")',
        'MATCH subscriptions <-[:owns_subscription]- user',
        'WHERE HAS(subscriptions.public) AND subscriptions.public = "true"',
        'RETURN subscriptions, user',
        'ORDERBY',
        'SKIP OFFSET_VALUE',
        'LIMIT LIMIT_VALUE'
    ].join('\n')
        .replace('ORDERBY', orderBy)
        .replace('OFFSET_VALUE', offset)
        .replace('LIMIT_VALUE', limit);

    db.query(query, {}, function (err, results) {
        console.log(results)
        if (err) return callback(err);
        var subscriptions = [];
        for (var i = 0; i < results.length; i++) {
            var subscription = new Subscription(results[i]['subscriptions']),
                subscriptionOwner = new User(results[i]['user']);
            if ((typeof subscription.public !== 'undefined' && subscription.public === true) ||
                (user && user.username === subscriptionOwner.username)) {
                subscriptions.push({subscription: subscription, owner: subscriptionOwner});
            }
        }
        callback(null, subscriptions);
    });
}

database.listUserSubscriptions = function (user, isSelf, offset, limit, orderBy, callback) {
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '',
        where = (isSelf) ? '' : 'WHERE HAS(subscriptions.public) AND subscriptions.public = "true"',
        query = [
        'START user = node({id})',
        'MATCH user -[:has_feed]-> feeds -[:has_subscription]-> subscriptions,',
        '      subscriptions <-[:owns_subscription]- subscriptionOwner',
        'WHERE_VALUE',
        'RETURN subscriptions, subscriptionOwner',
        'ORDERBY',
        'SKIP OFFSET_VALUE',
        'LIMIT LIMIT_VALUE'
    ].join('\n')
        .replace('WHERE_VALUE', where)
        .replace('ORDERBY', orderBy)
        .replace('OFFSET_VALUE', offset)
        .replace('LIMIT_VALUE', limit);

    var params = {
        id: user.id,
    };
    db.query(query, params, function (err, results) {
        console.log(err)
        if (err) return callback(err);
        var subscriptions = results.map(function(result) {
            var subscription = new Subscription(result['subscriptions']);
            var user = new User(result['subscriptionOwner'])
            return {subscription: subscription, subscriptionOwner: user};
        });
        callback(null, subscriptions);
    });
}

database.listFeedSubscriptions = function (feedId, isSelf, offset, limit, orderBy, callback) {
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '',
        where = (isSelf) ? '' : 'WHERE HAS(feed.public) AND feed.public = "true"',
        query = [
        'START feed = node({id})',
        'MATCH feed -[:has_subscription]-> subscriptions,',
        '      subscriptions <-[:owns_subscription]- subscriptionOwner',
        'WHERE_VALUE',
        'RETURN subscriptions, subscriptionOwner',
        'ORDERBY',
        'SKIP OFFSET_VALUE',
        'LIMIT LIMIT_VALUE'
    ].join('\n')
        .replace('WHERE_VALUE', where)
        .replace('ORDERBY', orderBy)
        .replace('OFFSET_VALUE', offset)
        .replace('LIMIT_VALUE', limit);
    var params = {
        id: Number(feedId)
    };
    db.query(query, params, function (err, results) {
        console.log(results)
        if (err) return callback(err);
        var subscriptions = results.map(function(result) {
            var subscription = new Subscription(result['subscriptions']);
            var user = new User(result['subscriptionOwner'])
            return {subscription: subscription, subscriptionOwner: user};
        });
        callback(null, subscriptions);
    });
}

database.listSubscriptionPosts = function(subscriptionId, isSelf, callback) {
    var where = (isSelf) ? '' : 'WHERE HAS(subscription.public) AND subscription.public = "true"',
        postsQuery = [
        'START subscription = node({id})',
        'MATCH subscription -[:FIRST_POST]-latestPost-[:NEXT_POST*0..50]-> nextPosts',
        'WITH nextPosts, subscription',
        'MATCH nextPosts -[?:FIRST_COMMENT]-latestComment-[?:NEXT_COMMENT*0..10]-> nextComments',
        'WHERE_VALUE',
        'RETURN nextPosts AS posts, COLLECT (nextComments) AS comments, nextPosts.date AS date',
        'ORDER BY nextPosts.date DESC LIMIT 50'
    ].join('\n')
        .replace('FIRST_POST', 'has_post')
        .replace('NEXT_POST', 'next_post')
        .replace('FIRST_COMMENT', 'has_comment')
        .replace('NEXT_COMMENT', 'next_comment')
        .replace('WHERE_VALUE', where),
        
        subscriptionQuery = [
        'START subscription = node({id})',
        'MATCH subscription <-[:owns_subscription]- subscriptionOwner,',
        '      subscription <-[:has_subscription]- subscriptionFeeds',
        'WHERE_VALUE',
        'RETURN subscription, subscriptionOwner, collect(subscriptionFeeds) AS feeds'
    ].join('\n')
        .replace('WHERE_VALUE', where);

    var params = {
        id: Number(subscriptionId)
    };
    db.query(postsQuery, params, function (err, postsResults) {
        if (err) return callback(err);
        db.query(subscriptionQuery, params, function (err, subscriptionResults) {
            if (err) return callback(err);
            var subscription = new Subscription(subscriptionResults[0]['subscription']),
                subscriptionOwner = new User(subscriptionResults[0]['subscriptionOwner']),
                feeds = subscriptionResults[0]['feeds'].map(function(feed) {
                    var feed = new Feed(feed);
                    return feed;
                }),
                posts = postsResults.map(function(result) {
                    var post = new Post(result['posts']);
                    var comments = result['comments'].map(function (comment) {
                        var comment = new Comment(comment);
                        return comment;
                    });
                    return {post: post, comments: comments};
                });
            callback(null, subscription, subscriptionOwner, feeds, posts);
        });
    });
}

database.fetchPost = function (user, postId, callback) {
    console.log(postId)
    var where = 'WHERE HAS(feed.public) AND feed.public = "true"',
        query = [
        'START post = node({postId})',
        'MATCH post <-[?:posted_post]- postOwner,',
        '      post <-[?:has_post|next_post*1..]- subscription,',
        '      post -[?:has_comment|next_comment*1..]-> comments',
        'WHERE HAS(subscription.public) AND HAS(postOwner.username) AND subscription.public = "true" OR postOwner.username = "' + user.username + '"',
        'RETURN postOwner, subscription, post, collect(comments) AS comments'
    ].join('\n');

    var params = {
        postId: Number(postId)
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        var subscription = new Subscription(results[0].subscription),
            postOwner = new User(results[0].postOwner),
            post = new Post(results[0].post),
            comments = results[0].comments.map(function (comment) {
                var comment = new Comment(comment);
                return comment;
            });

        callback(null, subscription, postOwner, post, comments);
    });
}
