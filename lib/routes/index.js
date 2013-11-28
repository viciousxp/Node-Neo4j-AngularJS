var express = require('express')
  , app = module.exports = express()
  , path = require('path')
  , routes = require('./routes');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.favicon());
}); 

/*****
    Angular Routes
        *****/

app.get('/', routes.index);
app.get('/partial/:name', routes.partial);

// catch all unmatched requests and deliver index, require to allow deep linking in Angular app.

app.use(routes.index);