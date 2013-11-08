/*
 * Serve JSON to our AngularJS client
 */

exports.search = require('./api/search');
exports.profile = require('./api/profile');
exports.utils = require('./api/utils');
exports.tags = require('./api/tags');

exports.listMenu = function (req, res) {
    var menu = '';
    if (req.user) {
        menu = [
            {"name": "Home", "link": "/"},
            {"name": "Profile", "link": "/profile/" + req.user.username},
            {"name": "Search", "link": "/search"},
            {"name": "Logout", "link": "/logout"}
        ]
    } else {
        menu = [
            {"name": "Home", "link": "/"},
            {"name": "Login", "link": "/login"}
        ];
    }
    res.send(200, menu);
}