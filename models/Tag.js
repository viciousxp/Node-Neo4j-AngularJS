// file: user.js
// Description: Tag Object subclass(Node)

var Node = require('./Node')
  , User = require('./User')
  , neo4j = require('neo4j')
  , db = new neo4j.GraphDatabase(process.env.NEO4J_URL || config.dev.NEO4J_URL || 'http://localhost:7474');

Tag.prototype = new Node();

Tag.prototype.constructor = Tag;

function Tag(_node) {
    this._node = _node;
}

Object.defineProperties(Tag.prototype, {
    tagName: {
        get: function () {
            return this._node.data['tagName'];
        },
        set: function (tagName) {
            this._node.data['tagName'] = tagName;
        },
        enumerable: true,
        configurable: true
    }
});

Tag.prototype.getNodes = function(params) {
    getRelationshipNodes(rels, function(err, nodes) {
        console.log(nodes);
    });
}

module.exports = Tag;