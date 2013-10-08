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
            if ($rootScope) {
                $http.get('/api/users/status/' + $rootScope.username)
                    .success(function(res) {
                        console.log('STATUS=> ' + res);
                        return $rootScope.username;
                    })
                    .error(error);
            } else {
                return {error: 401};
            }

        },
        register: function(user) {
            console.log('user=>' + user);
            $http.post('/api/users/register', user)
                .success(function(res) {
                success();
                })
                .error(error);
        },
        login: function(user) {
            console.log('user=>' + user);
            $http.post('/api/users/login', user)
                .success(function(res) {
                    console.log(res.user);
                    $rootScope.username = res.user;
                })
                .error(error);
        },
        sendPasswordReset: function(user) {
            $http.post('/api/users/sendPasswordReset', user)
                .success(function(res) {
                success();
                })
                .error(error);
        }
    }
}]);