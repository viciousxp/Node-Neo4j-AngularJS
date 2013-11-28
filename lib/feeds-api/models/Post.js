// file: post.js
// Description: Post Object subclass(Node)

var Node = require('../../../models/Node')
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

module.exports = Post;