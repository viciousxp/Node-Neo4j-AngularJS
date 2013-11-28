// file: database.js
// Description: database controller

// dependencies
var config = require('../config.js')
  , Feed = require('../lib/feeds-api/models/Feed.js')
  , User = require('../lib/users-api/models/User.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

var database = module.exports = {}

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
    console.log('listFeeds');
    var orderBy = (orderBy !== null) ? 'ORDER BY ' + orderBy : '';
    var query = [
        'START feeds = node(*)',
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