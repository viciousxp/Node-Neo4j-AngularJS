'use strict';

/* Controllers */

function AppCtrl($scope, $http) {

}

angular.module('myApp')
.controller('LoginCtrl', ['$scope', '$location', '$routeParams', 'Auth', function($scope, $location, $routeParams, Auth) {
    $scope.loginSelection = 'login';
    if ($routeParams.action === 'register') $scope.loginSelection = 'register';
    if ($routeParams.action === 'passwordReset') {
      $scope.loginSelection = 'passwordReset';
      if (!angular.isUndefined($routeParams.user) && !angular.isUndefined($routeParams.token)) $scope.passwordReset = true;
    }
    if ($routeParams.action === 'emailVerification') {
      if (!angular.isUndefined($routeParams.user) && !angular.isUndefined($routeParams.token)) {
        Auth.verifyEmail($routeParams.user, $routeParams.token, function (err, result) {
          if (err) $scope.error = err;
          if (result) {
            $scope.loginSelection = 'login';
            $scope.error = 'Thank you for verifying your email, please login';
          }
        });
      }
    }
    $scope.submitRegistration = function() {
        if (this.password === this.passwordRepeat) {
          var user = {
            username: this.username,
            email: this.email,
            password: this.password
          }
          Auth.register(user, function (err) {
            if (err) $scope.error = err;
            else $location.path('/profile/' + user.username);
          });
        } else {
          $scope.error = 'Passwords do not match';
        }
    }
    $scope.submitLogin = function() {
        var user = {
            'username' : this.username,
            'password' : this.password
        };
        Auth.login(user, function(err, user) {
          if (err) $scope.error = err;
          console.info(user)
          if (user) $location.path('/profile/' + user);
        });
    }
    $scope.submitPasswordReset = function() {
        Auth.sendPasswordReset(this.username, function (err, msg) {
          if (err) $scope.error = err;
          else $scope.error = msg;
        });
    }
    $scope.submitNewPassword = function() {
      if (this.password === this.passwordRepeat) Auth.passwordReset(this.password, $routeParams.user, $routeParams.token, function(err, data) {
        if (err) $scope.error = err;
        else {
          $scope.loginSelection = 'login';
          $scope.error = data;
        }
      });
    }
}])
.controller('ProfileCtrl', ['$rootScope', '$scope', '$routeParams', '$http', 'Auth', function($rootScope, $scope, $routeParams, $http, Auth) {
    if (typeof($routeParams.user) === 'undefined') return $location.path('/');
    var username = $routeParams.user;
    $scope.username = username;
    $scope.isOwnUser = false;
    $scope.showFollowButton = true;
    if (username === $rootScope.username) {
      $scope.searchUsers = '<h3><a href="/search">Search for more users to follow!</a></h3>';
      $scope.isOwnUser = true;
      $scope.showFollowButton = false;
      Auth.emailVerificationRequired(username ,function (err, result) {
        if (err) {
          $scope.emailVerificationRequired = true;
          $scope.emailMsg = err;
        } else {
          $scope.emailVerificationRequired = false;
        }
      });
    }
    $http({method: 'GET', url: '/api/users/following/' + username}).
    success(function(data, status, headers, config) {
      if (data.result) $scope.followButton = 'Unfollow';
      else $scope.followButton = 'Follow';
    }).
    error(function(data, status, headers, config) {
      $scope.showFollowButton = false;
    })

    $http({method: 'GET', url: '/api/users/getFollowing/' + username}).
    success(function(data, status, headers, config) {
      var userMsg = (username === $rootScope.username) ? 'You are ' : username + ' is ';
      if (data.length === 1) {
        $scope.following = userMsg + 'currently following ' + data.length + ' user.';
        $scope.followingUsers = data;
      } else if (data.length > 1) {
        $scope.following = userMsg + 'currently following ' + data.length + ' users.';
        $scope.followingUsers = data;
      } else {
        $scope.following = userMsg + 'not following anyone.';
      }
    }).
    error(function(data, status, headers, config) {
      $scope.following = 'An error has occured: ' + data.msg;
    })

    $http({method: 'GET', url: '/api/users/getFollowed/' + username}).
    success(function(data, status, headers, config) {
      var userMsg = (username === $rootScope.username) ? 'You are ' : username + ' is ';
      if (data.length === 1) {
        $scope.followed = userMsg + 'currently being followed by ' + data.length + ' user.';
        $scope.followedUsers = data;
      } else if (data.length > 1) {
        $scope.followed = userMsg + 'currently being followed by ' + data.length + ' users.';
        $scope.followedUsers = data;
      } else {
        $scope.followed = userMsg + 'not being followed by anyone.';
      }
    }).
    error(function(data, status, headers, config) {
      $scope.following = 'An error has occured: ' + data.msg;
    })

    $http({method: 'GET', url: '/api/users/profile/' + username}).
    success(function(data, status, headers, config) {
      $scope.infoCats = data;
    }).
    error(function(data, status, headers, config) {
      $scope.infoCats = 'An error has occured';
    })

    $scope.followUnfollow = function() {
      if ($scope.followButton === 'Follow') {
        $http.post('/api/users/follow/' + username).
        success(function(data, status, headers, config) {
          $scope.followButton = 'Unfollow';
        })
      } else if ($scope.followButton === 'Unfollow') {
        $http.post('/api/users/unfollow/' + username).
        success(function(data, status, headers, config) {
          $scope.followButton = 'Follow';
        })
      }
    }
    $scope.updateUserInfo = function(data) {
      return $http.post('/api/users/profile/' + username, {scope: this.infoCat[0], field: this.info.field, value: data, data: 'info'});
    };
    $scope.updateUserAcl = function(data) {
      return $http.post('/api/users/profile/' + username, {scope: this.infoCat[0], field: this.info.field, value: data, data: 'ACL'});
    };
}])
.controller('SearchCtrl', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
    $scope.searchInput = function() {
      console.log('update')
      var query = (typeof($scope.searchQuery) !== 'undefined') ? $scope.searchQuery : '*';
      $http({method: 'GET', url: '/api/users/search?q=' + query}).
      success(function(data, status, headers, config) {
        if (data.length > 0) {
          $scope.results = 'Results';                
          $scope.users = data;
        } else {
          $scope.results = 'Nothing found';
          $scope.users = [];
        }
      }).
      error(function(data, status, headers, config) {
        $scope.following = 'An error has occured: ' + data.msg;
      })
    };
    $scope.searchInput();
}]);


function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {}
MyCtrl2.$inject = [];

function TopMenuCtrl($rootScope, $http) {
  $http({method: 'GET', url: '/api/listMenu'}).
  success(function(data, status, headers, config) {
    $rootScope.listItems = data;
  }).
  error(function(data, status, headers, config) {
    $rootScope.listItems = [
        {"name": "Error!", "link": "error"}
        ];
  })
  $rootScope.menuOptions = 'Something'
}

var routeAuth = function($http, $rootScope, $location) {
  //check if user logged in
  if (typeof($rootScope.username) === 'undefined') {
  // if not logged in locally, make sure user is not logged in server side
    $http({method: 'GET', url: '/api/users/status'}).
    success(function(data, status, headers, config) {
      $rootScope.username = data;
      return;
    }).
    error(function(data, status, headers, config) {
      $location.url('/login');      
    })
  }
}

var logout = function($http, $rootScope, $location) {
  $http({method: 'GET', url: '/api/users/logout'}).
  success(function(data, status, headers, config) {
    $rootScope.username = null;
    $location.url('/');
  }).
  error(function(data, status, headers, config) {
    $rootScope.username = null;
    $location.url('/');    
  })  
}