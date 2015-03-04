"use strict"
app.factory('Auth',
	function ($rootScope, $state, $templateCache, $http, $location, $cookieStore) {
	
	 	
 	
		var Auth = {
			register: function (user) {				
				$http.post("/api/register", user)
					.success(function(data) {
						if(data){
							$cookieStore.put('signedIn', true);
							$cookieStore.put('userData', data);
							$rootScope.$broadcast('userLoggedIn',data);
						} else {
							Auth.logout();
						}
					})
					.error(function(data) {
						console.log('Error: ' + data);
					});
				//return auth.$createUser(user.email, user.password);
			},
			signedIn: function () {
				return $cookieStore.get('signedIn');
				//return auth.user !== null;
			},
			getUserData: function() {
				return $cookieStore.get('userData');
			},
			login: function (user) {
				$http.post("/api/login", user)
					.success(function(data) {
						if(data){
							$cookieStore.put('signedIn', true);
							$cookieStore.put('userData', data);
							$rootScope.$broadcast('userLoggedIn',data);
						}
					})
					.error(function(data) {
						console.log('Error: ' + data);
					});
			},
			logout: function () {
				console.log('logging out')
				$cookieStore.put('signedIn', false);
				$cookieStore.put('userData', {});
				$http.get("/api/logout")
					.success(function(data) {
						$state.go('home');
					})
					.error(function(data) {
						console.log('Error: ' + data);
					});
				//auth.$logout();
			}
		};
 
		return Auth;
	});