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
    }
});

Subscriptions.prototype.addPost = function(post, callback) {
  //first see if there are already existing posts
  var that = this;
  that.getOutgoingRelationships('has_post', function(err, nodes) {
    if (err) return callback(err);
    if (nodes.length === 0) {
      that.addRelationship(post, 'has_post', {}, function(err) {
          if (err) return callback(err);
          callback(null, post);
      });
    } else {
      var query = [
        'START subscription = node({id}), newPost = node({newPostId})',
        'MATCH subscription -[:RELATIONSHIP]-> lastPost, subscription -[rel?:RELATIONSHIP]-> lastPost',
        'CREATE subscription -[:RELATIONSHIP]-> newPost -[:NEXT_RELATIONSHIP]-> lastPost',
        'DELETE rel'
      ].join('\n')
          .replace('RELATIONSHIP', 'has_post')
          .replace('RELATIONSHIP', 'has_post')
          .replace('RELATIONSHIP', 'has_post')
          .replace('NEXT_RELATIONSHIP', 'next_post');

      var params = {
          id: that.id,
          newPostId: post.id
      };
      console.log('params: ' + JSON.stringify(params))
      db.query(query, params, function (err, results) {
          console.log(err)
          if (err) return callback(err);
          console.log('results: ' + JSON.stringify(results));
          callback(null)
      });
    }
  });
}

module.exports = Subscriptions;