// file: comment.js
// Description: Comment Object subclass(Node)

var Node = require('../../../models/Node')
  , Feed = require('./Feed')
  , Subscription = require('./Subscription')
  , Post = require('./Post')
  , config = require('../../../config.js')
  , functions = require('../../../routes/functions')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

Comment.prototype = new Node();

Comment.prototype.constructor = Comment;

function Comment(_node) {
    this._node = _node;
}

Object.defineProperties(Comment.prototype, {
    author: {
        get: function () {
            return this._node.data['author'];
        },
        set: function (author) {
            this._node.data['author'] = author;
        },
        enumerable: true,
        configurable: true
    },
    date: {
        get: function () {
            return this._node.data['date'];
        },
        set: function (date) {
            this._node.data['date'] = date;
        },
        enumerable: true,
        configurable: true
    },
    body: {
        get: function () {
            return this._node.data['body'];
        },
        set: function (body) {
            this._node.data['body'] = body;
        },
        enumerable: true,
        configurable: true
    }
});

Comment.prototype.delete = function(callback) {
    var that = this,
        queryRels = [
            'START comment = node({id})',
            'MATCH () -[incomingRel?]-> comment -[outgoingRel?]-> ()',
            'RETURN type(incomingRel), type(outgoingRel)'
        ].join('\n'),
        queryFirstWithNext = [
            'START comment = node({id})',
            'MATCH previous -[incomingRel:has_comment]-> comment -[outgoingRel:next_comment]-> next,',
            '      comment <-[postedCommentRel:posted_comment]- ()',
            'DELETE incomingRel, comment, outgoingRel, postedCommentRel',
            'CREATE previous -[:has_comment]-> next'
        ].join('\n'),
        queryFirstWithoutNext = [
            'START comment = node({id})',
            'MATCH previous -[incomingRel:has_comment]-> comment,',
            '      comment <-[postedCommentRel:posted_comment]- ()',
            'DELETE incomingRel, comment, postedCommentRel'
        ].join('\n'),
        queryMiddle = [
            'START comment = node({id})',
            'MATCH previous -[incomingRel:next_comment]-> comment -[outgoingRel:next_comment]-> next,',
            '      comment <-[postedCommentRel:posted_comment]- ()',
            'DELETE incomingRel, comment, outgoingRel, postedCommentRel',
            'CREATE previous -[:next_comment]-> next'
        ].join('\n'),
        queryLast = [
            'START comment = node({id})',
            'MATCH previous -[incomingRel:next_comment]-> comment,',
            '      comment <-[postedCommentRel:posted_comment]- ()',
            'DELETE incomingRel, comment, postedCommentRel'
        ].join('\n');

    var params = {
        id: that.id,
    };

    db.query(queryRels, params, function (err, results) {
        if (err) return callback(err);
        var incoming = results[0]['type(incomingRel)'],
            outgoing = results[0]['type(outgoingRel)'],
            query = '';
        if (incoming === 'has_comment' && outgoing === 'next_comment') query = queryFirstWithNext;
        if (incoming === 'has_comment' && outgoing === null) query = queryFirstWithoutNext;
        if (incoming === 'next_comment' && outgoing === 'next_comment') query = queryMiddle;
        if (incoming === 'next_comment' && outgoing === null) query = queryLast;
        db.query(query, params, function (err) {
            if (err) return callback(err);
            callback(null)
        });
    });
}

Comment.prototype.getFeedAuthor = function(callback) {
    console.log('getFeedAuthor');
    var that = this,
        query = [
        'START comment = node({id})',
        'MATCH comment <-[rel?:has_comment|next_comment|has_post|next_post|has_subscription|has_feed*..]- comments,',
        '      comment <-[:posted_comment]- commentAuthor',
        'WITH comments, commentAuthor',
        'MATCH comments <-[:has_feed]- user',
        'RETURN user, commentAuthor'
    ].join('\n');

    var params = {
        id: that.id
    };
    db.query(query, params, function (err, results) {
        console.log('new err: ' + err)
        if (err) return callback(err);
        callback(null, results[0]);
    });
}

module.exports = Comment;