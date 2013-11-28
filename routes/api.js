/*
 * Serve JSON to our AngularJS client
 */

exports.listMenu = function (req, res) {
    var menu = '';
    if (req.user) {
        menu = [
            {"name": "Home", "link": "/"},
            {"name": "Profile", "link": "/" + req.user.username + "/profile"},
            {"name": "Search", "link": "/search"},
            {"name": "Logout", "link": "/logout"}
        ]
    } else {
        menu = [
            {"name": "Home", "link": "/"},
            {"name": "Register", "link": "/login/register"},
            {"name": "Login", "link": "/login/login"}
        ];
    }
    res.send(200, menu);
}