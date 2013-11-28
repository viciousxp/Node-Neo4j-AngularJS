var User = require('../../models/User')
  , database = require('../../../../routes/database');

exports.search = function(req, res) {
    options = {
        index : 'users',
        property : 'username',
        query : req.query.q ? req.query.q : null,
        fuzzy : false,
        partial : true
    };

    console.log(options)

    database.queryBuilder(options, function(err, nodes) {
        console.log('nodes = ' + nodes)
        if (err) return res.send(500, {msg: 'Server Error'});
        users = nodes.map(function (node) {
            var user = new User(node);
            console.log(user.username)
            return {'username': user.username};
        });
        res.send(200, users);
    });
};