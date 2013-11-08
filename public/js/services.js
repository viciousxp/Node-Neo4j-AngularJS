'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

angular.module('myApp')
.factory('Auth', ['$rootScope', '$http', function($rootScope, $http) {
    return {
        status: function() {
            $http({method: 'GET', url: '/api/users/status'}).
            success(function(data, status, headers, config) {
                $rootScope.username = data;
            }).
            error(function(data, status, headers, config) {
                $location.url('/login');      
            })
        },
        register: function(user) {
            console.log('user=>' + user);
            $http.post('/api/users/register', user)
                .success(function(res) {
                success();
                })
                .error(error);
        },
        login: function(user, callback) {
            console.log('user=>' + user);
            $http.post('/api/users/login', user)
                .success(function(res) {
                    $rootScope.username = res.user;
                    callback(null, $rootScope.username);
                })
                .error(function(res) {
                    callback(res.err);
                });
        },
        sendPasswordReset: function(user, callback) {
            $http.post('/api/users/sendPasswordReset/' + user)
                .success(function (res) {
                    callback(null, res.msg);
                })
                .error(function (res) {
                    callback(res.msg)
                });
        }
    }
}]);