exports.getSchema = function(req, res) {
    var schema = require(__dirname + '/../../schemas/' + req.params.name + '.js')
    res.send(200, schema);
}