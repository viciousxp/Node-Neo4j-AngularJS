// file: post.js
// Description: Post Object subclass(Node)

var Node = require('../../../models/Node')
  , User = require('../../../lib/users-api/models/User')
  , config = require('../../../config.js')
  , functions = require('../../../routes/functions')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

Post.prototype = new Node();

Post.prototype.constructor = Post;

function Post(_node) {
    this._node = _node;
}

Object.defineProperties(Post.prototype, {
    postId: {
        get: function () {
            return this._node.data['postId'];
        },
        set: function (postId) {
            this._node.data['postId'] = postId;
        },
        enumerable: true,
        configurable: true
    },
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
    body: {
        get: function () {
            return this._node.data['body'];
        },
        set: function (body) {
            this._node.data['body'] = body;
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
    }
});

Post.prototype.addComment = function(user, comment, callback) {
  var that = this;
  that.getOutgoingRelationships('has_comment', function (err, nodes) {
    if (err) return callback(err);
    if (nodes.length === 0) {
      that.addRelationship(comment, 'has_comment', {}, function (err) {
          if (err) return callback(err);
          user.addRelationship(comment, 'posted_comment', {}, function (err) {
            if (err) return callback(err);            
            callback(null);
          })
      });
    } else {
      var query = [
        'START user = node({userId}), post = node({id}), newComment = node({newCommentId})',
        'MATCH post -[:RELATIONSHIP]-> lastComment, post -[rel?:RELATIONSHIP]-> lastComment',
        'CREATE post -[:RELATIONSHIP]-> newComment -[:NEXT_RELATIONSHIP]-> lastComment,',
        '       user -[:posted_comment]-> newComment',
        'DELETE rel'
      ].join('\n')
          .replace('RELATIONSHIP', 'has_comment')
          .replace('RELATIONSHIP', 'has_comment')
          .replace('RELATIONSHIP', 'has_comment')
          .replace('NEXT_RELATIONSHIP', 'next_comment');

      var params = {
          userId: user.id,
          id: that.id,
          newCommentId: comment.id
      };
      db.query(query, params, function (err, results) {
          console.log('err1: ' + err);
          if (err) return callback(err);
          callback(null)
      });
    }
  });
}

Post.prototype.getRelevantUsers = function(callback) {
    var query = [
        'START post = node({id})',
        'MATCH post <-[:posted_post]- postOwner,',
        '      post <-[?:has_post|next_post*]- subscription',
        'WITH  postOwner, collect(subscription) AS subscription',
        'WITH  postOwner, LAST(subscription) AS lastSubscription',
        'MATCH lastSubscription <-[:owns_subscription]- subscriptionOwner',
        'RETURN postOwner, subscriptionOwner'
    ].join('\n');

    var params = {
        id: this.id,
    };

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        console.log('res: ' + results)
        var postOwner = new User(results[0].postOwner),
            subscriptionOwner = new User(results[0].subscriptionOwner);
        callback(null, postOwner, subscriptionOwner);
    });
}

Post.prototype.delete = function(callback) {
    var that = this,
        queryRels = [
            'START post = node({id})',
            'MATCH () -[incomingRel?:has_post|next_post]-> post -[outgoingRel?:has_post|next_post]-> ()',
            'RETURN type(incomingRel), type(outgoingRel)'
        ].join('\n'),
        queryFirstWithNext = [
            'START post = node({id})',
            'MATCH previous -[:has_post]-> post -[:next_post]-> next,',
            '      post -[postRels]- ()',
            'WITH  previous, next, post, postRels',
            'MATCH post -[?:has_comment|next_comment*1..]-> comments -[commentsRels?]- ()',
            'DELETE commentsRels, postRels',
            'WITH previous, next, post, comments',
            'DELETE post, comments',
            'CREATE previous -[:has_post]-> next'
        ].join('\n'),
        queryFirstWithoutNext = [
            'START post = node({id})',
            'MATCH previous -[:has_post]-> post,',
            '      post -[postRels]- ()',
            'WITH  previous, post, postRels',
            'MATCH post -[?:has_comment|next_comment*1..]-> comments -[commentsRels?]- ()',
            'DELETE commentsRels, postRels',
            'WITH previous, post, comments',
            'DELETE post, comments'
        ].join('\n'),
        queryMiddle = [
            'START post = node({id})',
            'MATCH previous -[:next_post]-> post -[:next_post]-> next,',
            '      post -[postRels]- ()',
            'WITH  previous, next, post, postRels',
            'MATCH post -[?:has_comment|next_comment*1..]-> comments -[commentsRels?]- ()',
            'DELETE commentsRels, postRels',
            'WITH previous, next, post, comments',
            'DELETE post, comments',
            'CREATE previous -[:next_post]-> next'
        ].join('\n'),
        queryLast = [
            'START post = node({id})',
            'MATCH previous -[:next_post]-> post,',
            '      post -[postRels]- ()',
            'WITH  previous, post, postRels',
            'MATCH post -[?:has_comment|next_comment*1..]-> comments -[commentsRels?]- ()',
            'DELETE commentsRels, postRels',
            'WITH previous, post, comments',
            'DELETE post, comments'
        ].join('\n');

    var params = {
        id: that.id,
    };

    db.query(queryRels, params, function (err, results) {
        console.log('err0: ' + err);
        if (err) return callback(err);
        var incoming = results[0]['type(incomingRel)'],
            outgoing = results[0]['type(outgoingRel)'],
            query = '';
            console.log(incoming + ":" + outgoing)
        if (incoming === 'has_post' && outgoing === 'next_post') query = queryFirstWithNext;
        if (incoming === 'has_post' && outgoing === null) query = queryFirstWithoutNext;
        if (incoming === 'next_post' && outgoing === 'next_post') query = queryMiddle;
        if (incoming === 'next_post' && outgoing === null) query = queryLast;
        db.query(query, params, function (err) {
            console.log('err1: ' + err);
            if (err) return callback(err);
            callback(null)
        });
    });
}

module.exports = Post;