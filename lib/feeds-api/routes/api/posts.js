var User = require('../../../users-api/models/User')
  , Feed = require('../../models/Feed')
  , Subscription = require('../../models/Subscription')
  , Post = require('../../models/Post')
  , database = require('../../../../routes/database')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

exports.getSinglePost = function (req, res) {
    var user,
        postId = req.params.postId;

    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
            if (err) return res.send(500, err);
            if (nodes.length === 0) return res.send(404, 'User not found');
            user = new User(nodes[0]);
            fetchPost(user);
        });
    } else {
        user = req.user;
        fetchPost(user);
    }

    function fetchPost (user) {
        database.fetchPost(user, postId, function(err, subscription, postOwner, post, comments) {
            console.log('subscription: ' + subscription.id)
            console.log('user: ' + postOwner.id)
            console.log('post: ' + post.id)
            comments.map(function (comment) {
                console.log('comment: ' + comment.id);
            });
        });
    }
}

exports.deletePost = function (req, res) {
    var user = req.user;

    database.getNodeById(req.params.postId, function (err, node) {
        console.log('err2: ' + err);
        if (err) return res.send(500, {err: 'Server Error'});
        var post = new Post(node);
        post.getRelevantUsers(function(err, postOwner, subscriptionOwner) {
            console.log('err3: ' + err);
            if (err) return res.send(500, {err: 'Server Error'});
            if (user.username !== postOwner.username || user.username !== subscriptionOwner.username) {
                res.send(401);
            } else {
                post.delete(function(err) {
                    console.log('err4: ' + err);
                    if (err) return res.send(500, {err: "Server Error"});
                    res.send(200);
                })
            }
        });
    })
}