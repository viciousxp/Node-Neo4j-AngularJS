var express = require('express')
  , app = express()
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisStore = require('connect-redis')(express)
  , RedisDB = require('redis')
  , api = require('./routes/api');
//require('./lib/user-api/routes')
var routes = require('./lib/routes');
var usersAPI = require('./lib/users-api');
var followAPI = require('./lib/follow-api');
var feedsAPI = require('./lib/feeds-api');

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }
}); 

//require sub apps

app.use(usersAPI);
app.use(followAPI);
app.use(feedsAPI);

/*****
    ReST API
        *****/

app.get('/api/listMenu', api.listMenu);



//Tags API
//app.get('/api/tags/:tagName', api.tags.list);
//app.post('/api/tags/:tagName', api.tags.tag);

//Schema Server
//app.get('/api/utils/schema/:name', api.utils.getSchema);

/*****
    Include routes app which serves static files and jade templates and partials.
    Must be included last because it will catch all unmatched routes and deliver the
    index template to allow for deep linking in angular app.
        *****/

app.use(routes);

/*****
    Start Server
        *****/

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});