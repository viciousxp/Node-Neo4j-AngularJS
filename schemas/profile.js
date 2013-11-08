exports.schema = {
    "type":"object",
    "$schema": "http://json-schema.org/draft-03/schema",
    "title": "User Profile",
    "name": "profile",
    "description": "User Profile JSON Schema V3",
    "required":true,
    "properties":{
        "basic": {
            "type":"object",
            "required":true,
            "properties":{
                "bday": {
                    "type":"string",
                    "required":false
                },
                "city": {
                    "type":"string",
                    "required":true
                },
                "country": {
                    "type":"string",
                    "required":true
                },
                "fName": {
                    "type":"string",
                    "required":true
                },
                "lName": {
                    "type":"string",
                    "required":true
                }
            }
        }
    }
}