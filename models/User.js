// file: user.js
// Description: User Object subclass(Node)

var Node = require('./Node')
  , config = require('../config.js')
  , functions = require('../routes/functions')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

User.prototype = new Node();

User.prototype.constructor = User;

function User(_node) {
    this._node = _node;
}

Object.defineProperties(User.prototype, {
    username: {
        get: function () {
            return this._node.data['username'];
        },
        set: function (username) {
            this._node.data['username'] = username;
        },
        enumerable: true,
        configurable: true
    },
    email: {
        get: function () {
            return this._node.data['email'];
        },
        set: function (email) {
            console.info('email: ' + email)
            console.info('email: ' + this._node.data['email'])
            this._node.data['email'] = email;
        },
        enumerable: true,
        configurable: true
    },
    password: {
        get: function () {
            return this._node.data['password'];
        },
        set: function (password) {
            this._node.data['password'] = password;
        },
        enumerable: true,
        configurable: true
    },
    emailVerification: {
        get: function () {
            return this._node.data['emailVerification'];
        },
        set: function (emailVerification) {
            this._node.data['emailVerification'] = emailVerification;
        },
        enumerable: true,
        configurable: true
    },
    verified: {
        get: function () {
            return this._node.data['verified'];
        },
        set: function (verified) {
            this._node.data['verified'] = verified;
        },
        enumerable: true,
        configurable: true
    },
    passwordReset: {
        get: function () {
            return this._node.data['passwordReset'];
        },
        set: function (passwordReset) {
            console.info('passwordReset: ' + passwordReset)
            console.info('passwordReset: ' + this._node.data['passwordReset'])
            this._node.data['passwordReset'] = passwordReset;
        },
        enumerable: true,
        configurable: true
    },
    profile: {
        get: function () {
            return this._node.data['profile'];
        },
        set: function (profile) {
            this._node.data['profile'] = profile;
        },
        enumerable: true,
        configurable: true
    },
    profileACL: {
        get: function () {
            return this._node.data['profileACL'];
        },
        set: function (profileACL) {
            this._node.data['profileACL'] = profileACL;
        },
        enumerable: true,
        configurable: true
    }
});

//User.prototype = Node.prototype;

User.prototype.verifyEmail = function() {
    var message = "<h2>Hello, thank you for signing up, please click the link bellow to verify your email</h2>";
        message +=   '<a href="http://192.168.0.104:3000/emailVerification/' + this._node.data.username + '/' + this._node.data.emailVerification + '">Click Here</a>';
    functions.sendEmail(this._node.data.email, 'Email Verifivation', message);
}

User.prototype.verifyEmailCode = function(vCode) {
    if (this._node.data['emailVerification'] === vCode) return true;
    return false;
}

User.prototype.sendPasswordReset = function() {
    var message = "<h2>Click on the link to reset your password</h2>";
        message +=   '<a href="http://192.168.0.104:3000/passwordReset/' + this._node.data.username + '/' + this._node.data.passwordReset + '">Reset Email</a>';
    functions.sendEmail(this._node.data.email, 'Password Reset', message);
}

User.prototype.verifyPasswordResetCode = function(vCode) {
    if (this._node.data.passwordReset === vCode) return true;
    return false;
}

//temp method, will be replaced when new neo4j connector is ready
User.prototype.getOtherUsers = function(callback) {
    var query = [
        'START user=node({userId}), users=node:INDEX_NAME(\'username:*\')',
        'MATCH (user) -[rel?:FOLLOWS_REL]-> (users)',
        'WHERE rel is null',
        'RETURN users',
    ].join('\n')
        .replace('INDEX_NAME', 'users')
        .replace('FOLLOWS_REL', 'follows');;

    var params = {
        userId: this.id,
    };

    var user = this,
        others = [];

    db.query(query, params, function (err, results) {
        if (err) return callback(err);
        
        /*for (var i = results.length-1; i > 0; i--) {
            var user = new User(results[i]['users']);
            if (params.userId === user.id) {
                continue;
            } else {
                others.push(user);
            }
        }*/
        callback(null, results);
    });    

}

module.exports = User;