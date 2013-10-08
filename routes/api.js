/*
 * Serve JSON to our AngularJS client
 */

exports.name = function (req, res) {
    res.json({
        name: 'Ramee'
    });
};

exports.listMenu = function (req, res) {
    res.json([
        {"name": "Login", "link": "/login"},
        {"name": "View 2", "link": "view2"},
        {"name": "View 3", "link": "view3"},
        {"name": "View 4", "link": "view4"},
        {"name": "View 5", "link": "view5"}
    ]);
}