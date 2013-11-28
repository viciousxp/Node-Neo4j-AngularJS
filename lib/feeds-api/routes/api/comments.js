var User = require('../../../users-api/models/User')
  , Feed = require('../../models/Feed')
  , Subscription = require('../../models/Subscription')
  , Post = require('../../models/Post')
  , Comment = require('../../models/Comment')
  , database = require('../../../../routes/database')
  , config = require('../../../../config.js')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

exports.postComment = function (req, res) {
    var user = req.user,
        postId = req.params.postId,
        commentBody = req.body.commentBody
        date = new Date();

    //get post by id
    database.getNodeById(postId, function (err, node) {
        if (err) return res.send(500, {err: 'Server Error'});
        var post = new Post(node),
            data = {
                author: user.username,
                body: commentBody,
                date: date
            },
            comment = db.createNode(data);

        comment.save(function (err, node) {
            if (err) return res.send(500, {err: 'Server Error'});
            comment = new Comment(node);
            post.addComment(user, comment, function(err) {
                if (err) return res.send(500, {msg: 'Server Error'});
                else {
                    var data = {
                        id: comment.id,
                        author: comment.author,
                        body: comment.body,
                        date: comment.date
                    }
                    res.send(200, {comment: data});
                }
            });
        });
    });
}

exports.updateComment = function (req, res) {
    var user = req.user;

    database.getNodeById(req.params.commentId, function (err, node) {
        console.log('err2: ' + err)
        if (err) return res.send(500, {err: 'Server Error'});
        var comment = new Comment(node);
        comment.getFeedAuthor(function(err, node) {
            if (err) return res.send(500, {err: 'Server Error'});
            var subscriptionOwner = new User(node['user']),
                commentOwner = new User(node['commentAuthor']);
            if (user.username !== subscriptionOwner.username || user.username !== commentOwner.username) {
                console.log(subscriptionOwner.author)
                console.log(commentOwner.username)
                console.log(user.username)
                res.send(401);
            } else {
                comment.body = req.body.commentBody;
                comment.save(function(err) {
                    console.log('err23 ' + err)
                    if (err) return;
                    else return res.send(200);
                })
            }
        });
    })
}

exports.deleteComment = function (req, res) {
    var user = req.user;

    database.getNodeById(req.params.commentId, function (err, node) {
        console.log('err2: ' + err)
        if (err) return res.send(500, {err: 'Server Error'});
        var comment = new Comment(node);
        comment.getFeedAuthor(function(err, node) {
            if (err) return res.send(500, {err: 'Server Error'});
            var subscriptionOwner = new User(node['user']),
                commentOwner = new User(node['commentAuthor']);
            if (user.username !== subscriptionOwner.username || user.username !== commentOwner.username) {
                console.log(subscriptionOwner.author)
                console.log(commentOwner.username)
                console.log(user.username)
                res.send(401);
            } else {
                comment.delete(function(err) {
                    console.log('err23 ' + err)
                    if (err) return;
                    else return res.send(200);
                })
            }
        });
    })
}