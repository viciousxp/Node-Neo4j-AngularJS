'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ngRoute', 'ngSanitize', 'xeditable']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partial/partial1',
        controller: 'TopMenuCtrl'
    });
    $routeProvider.when('/login/:action?/:user?', {
        templateUrl: 'partial/login',
        controller: 'TopMenuCtrl'
    });
    $routeProvider.when('/logout', {
        resolve: {
            user: logout
        }
    });
    $routeProvider.when('/profile/:user', {
        templateUrl: 'partial/profile',
        controller: 'TopMenuCtrl',
        resolve: {
            user: routeAuth
        }
    });
    $routeProvider.when('/search', {
        templateUrl: 'partial/search',
        controller: 'TopMenuCtrl',
        resolve: {
            user: routeAuth
        }
    });
    $routeProvider.otherwise({redirectTo: '/'});
    $locationProvider.html5Mode(true);
  }])
  .run(function(editableOptions) {
    editableOptions.theme = 'bs3';
});