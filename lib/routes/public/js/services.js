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
        emailVerificationRequired: function(user, callback) {
            $http({method: 'GET', url: '/api/users/isEmailVerified/' + user}).
            success(function(data, status, headers, config) {
                if (!data.result) callback('Please verify your email');
                else callback(null, true);
            }).
            error(function(data, status, headers, config) {
                callback('Server Error')
            })
        },
        verifyEmail: function (user, token, callback) {
            $http.post('/api/users/verifyEmail/' + user, {token: token}).
            success(function(data, status, headers, config) {
                if (!data.result) {
                    if (data.msg) callback(data.msg);
                    else callback('Token is incorrect or expired');
                }
                else callback(null, true);
            }).
            error(function(data, status, headers, config) {
                callback(data.msg)
            })
        },
        register: function(user, callback) {
            $http.post('/api/users/register', user)
                .success(function(res) {
                    $rootScope.username = res.user;
                    callback(null, $rootScope.username);
                })
                .error(function(res) {
                    callback(res.err);
                });
        },
        login: function(user, callback) {
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
        },
        passwordReset: function(password, user, token, callback) {
            $http.post('/api/users/passwordReset/' + user, {password: password, token: token})
                .success(function (res) {
                    callback(null, res.msg);
                })
                .error(function (res) {
                    callback(res.msg)
                });
        }
    }
}]);