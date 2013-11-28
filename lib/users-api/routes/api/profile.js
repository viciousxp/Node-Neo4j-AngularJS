var User = require('../../models/User')
  , database = require('../../../../routes/database')
  , JSV = require("JSV").JSV
  , env = JSV.createEnvironment()
  , profileSchema = require('../../../../schemas/profile').schema;

exports.update = function(req, res) {
    var user = req.user,
        profile = (typeof user.profile !== 'undefined') ? JSON.parse(user.profile) : {},
        profileACL = (typeof user.profileACL !== 'undefined') ? JSON.parse(user.profileACL) : {},
        data = parseSchema(profileSchema, profile, profileACL, false);

    if (validateData(data, req.body)) {
        if (req.body.data === 'info') {
            profile[req.body.scope] = (typeof profile[req.body.scope] === 'undefined') ? {} : profile[req.body.scope];
            profile[req.body.scope][req.body.field] = req.body.value;
            user.profile = JSON.stringify(profile);
        } else if (req.body.data === 'ACL') {
            profileACL[req.body.scope] = (typeof profileACL[req.body.scope] === 'undefined') ? {} : profileACL[req.body.scope];
            profileACL[req.body.scope][req.body.field] = req.body.value;
            user.profileACL = JSON.stringify(profileACL);
        }
        user.save(function (err) {
            if (err) return res.send(500, 'Server error');
            res.send(200, 'success');
        });
    }
}

exports.get = function(req, res) {
    var publicProfile = true,
        user;

    if (!req.isSelf) {
        database.getIndexedNodes('users', 'username', req.params.id, function (err, nodes) {
            if (err) return res.send(500, err);
            if (nodes.length === 0) return res.send(500, 'User not found');
            user = new User(nodes[0]);
            fetchProfile(user);
        });
    } else {
        publicProfile = false;
        user = req.user;
        fetchProfile(user);
    }

    function fetchProfile(user) {
        var profile = (typeof user.profile !== 'undefined') ? JSON.parse(user.profile) : {},
            profileACL = (typeof user.profileACL !== 'undefined') ? JSON.parse(user.profileACL) : {},
            data = parseSchema(profileSchema, profile, profileACL, publicProfile);
        res.send(200, data)
    }
}

function parseSchema(schema, profileData, profileACL, publicProfile) {
    var data = []
        containsData = false;
    function _parseSchema(schema, data, profileData, profileACL) {
        var profileDataItem, profileACLItem, isPublic;
        for (var key in schema) {
            if (schema.hasOwnProperty(key) && typeof(schema[key]) === 'object') {
                if (key !== 'properties') {
                    if (typeof(schema[key]['properties']) === 'object') {
                        profileDataItem = (typeof profileData[key] !== 'undefined') ? profileData[key] : {};
                        profileACLItem = (typeof profileACL[key] !== 'undefined') ? profileACL[key] : {};
                        data.push([key, []]);
                        _parseSchema(schema[key]['properties'], data[data.length-1][1], profileDataItem, profileACLItem)
                    } else {
                        profileDataItem = (typeof profileData[key] !== 'undefined') ? profileData[key] : '';
                        profileACLItem = (typeof profileACL[key] !== 'undefined') ? profileACL[key] : '';
                        if (publicProfile && profileACLItem === true) {
                            containsData = true;
                            data.push({field: key, value : profileDataItem});
                        } else if (!publicProfile) {
                            containsData = true;
                            isPublic = (profileACLItem === true) ? true : false;
                            data.push({field: key, value : profileDataItem, public: isPublic});
                        }
                    }
                } else if (key === 'properties') {
                    _parseSchema(schema[key], data, profileData, profileACL)
                }
            }
        }
    }
    _parseSchema(schema, data, profileData, profileACL);
    return (containsData) ? data : [];
}

function validateData(data, postData) {
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i][1].length; j++) {
            if (postData.scope === data[i][0] && postData.field === data[i][1][j].field) {
                return true;
            }
        }
    }
    return false;
}