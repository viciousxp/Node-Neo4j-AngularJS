// file: subscriptions.js
// Description: Subscriptions Object subclass(Node)

var Node = require('../../../models/Node')
  , Post = require('./Post')
  , config = require('../../../config.js')
  , functions = require('../../../routes/functions')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

Subscriptions.prototype = new Node();

Subscriptions.prototype.constructor = Subscriptions;

function Subscriptions(_node) {
    this._node = _node;
}

Object.defineProperties(Subscriptions.prototype, {
    subscriptionName: {
        get: function () {
            return this._node.data['subscriptionName'];
        },
        set: function (subscriptionName) {
            this._node.data['subscriptionName'] = subscriptionName;
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

Subscriptions.prototype.addPost = function(user, post, callback) {
  //first see if there are already existing posts
  var that = this;
  that.getOutgoingRelationships('has_post', function(err, nodes) {
    if (err) return callback(err);
    if (nodes.length === 0) {
      var query = [
        'START subscription = node({id}), post = node({postId}), user = node({userId})',
        'CREATE subscription -[:has_post]-> post,',
        '       user -[:posted_post]-> post'
      ].join('\n');

      var params = {
          id: that.id,
          userId: user.id,
          postId: post.id
      };
    } else {
      var query = [
        'START subscription = node({id}), post = node({postId}), user = node({userId})',
        'MATCH subscription -[:has_post|next_post*1..]-> postPath',
        'WITH post, user, collect(postPath) AS postPath',
        'WITH post, user, LAST(postPath) AS lastPost',
        'CREATE lastPost -[:next_post]-> post,',
        '       user -[:posted_post]-> post'
      ].join('\n');

      var params = {
          id: that.id,
          userId: user.id,
          postId: post.id
      };
    }
    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        callback(null)
    });
  });
}

module.exports = Subscriptions;