'use strict';

/* Controllers */

function AppCtrl($scope, $http) {
  $http({method: 'GET', url: '/api/name'}).
  success(function(data, status, headers, config) {
    $scope.name = data.name;
  }).
  error(function(data, status, headers, config) {
    $scope.name = 'Error!'
  });
}

angular.module('myApp')
.controller('LoginCtrl', ['$scope', 'Auth', function($scope, Auth) {
    $scope.submitRegistration = function() {
        var user = this.user;
        console.log('user-> ' + user);
        Auth.register(user);
    }
    $scope.submitLogin = function() {
        var user = {
            'username' : this.username,
            'password' : this.password
        };
        Auth.login(user);
    }
    $scope.submitPasswordReset = function() {
        Auth.sendPasswordReset(JSON.stringify(this.user));
    }
}]);

function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {}
MyCtrl2.$inject = [];

function TopMenuCtrl($scope, $http) {
  $http({method: 'GET', url: '/api/listMenu'}).
  success(function(data, status, headers, config) {
    $scope.listItems = data;
  }).
  error(function(data, status, headers, config) {
    $scope.listItems = [
        {"name": "Error!", "link": "error"}
        ];
  })
  $scope.menuOptions = 'Something'
}