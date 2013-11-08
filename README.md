# Angular Express Neo4j Seed

Forked from [btford/angular-express-seed](https://github.com/btford/angular-express-seed) 

The goal of this project is to create a base for a social media type webapp running on angular, node/express, neo4j and Passport/Redis.

I am aiming for these functionalities: 
User management (login, logout, register, password reset, email verification, profiles public and private)
Basic Search to search through relationships, users, tags and other post types.
Add/Remove relationships between users and nodes, such as follows, likes, etc..
Creating and deleting "feeds" which you can post to and to which you can add the posts of people you follow.


## How to use angular-express-seed

Incomplete, npm config incimplete, more to come.

### Running the app

Incomplete, app does not run out of the box yet. Some module need to be installed manually.

### Running tests

Definitely coming soon! Test for Angular and for node.

## Directory Layout
    
    app.js              --> app config
    package.json        --> for npm
    public/             --> all of the files to be used in on the client side
      bootstrap/        --> all bootstrap files
        css/
        img/
        js/
      css/              --> css files
        app.css         --> default stylesheet
      img/              --> image files
      js/               --> javascript files
        app.js          --> declare top-level app module
        controllers.js  --> application controllers
        directives.js   --> custom angular directives
        filters.js      --> custom angular filters
        services.js     --> custom angular services
        lib/            --> angular and 3rd party JavaScript libraries
          angular/
            angular.js            --> the latest angular js
            angular.min.js        --> the latest minified angular js
            angular-*.js          --> angular add-on modules
            version.txt           --> version number
    routes/
        Update next release
    views/
        Update next release

## Contact

For more information on AngularJS please check out http://angularjs.org/
For more on Express and Jade, http://expressjs.com/ and http://jade-lang.com/ are
your friends.

Please contact me if you have any comments/suggestions. As everyone else, we are always learing and exchanging tips, tricks, and best practices!
