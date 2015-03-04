"use strict"

app.controller('AuthCtrl', function ($scope, $location, Auth) {
	

	$scope.user = {};

	$scope.$on('userLoggedIn',function(event, userData){
		$scope.userData = userData;
	})

	if(Auth.getUserData()){
		$scope.userData = Auth.getUserData();
	}

	$scope.login = function () {
		Auth.login($scope.user);
	 
	};

	$scope.register = function () {
		Auth.register($scope.user);
		
	};
	
	$scope.logout = function(){
		Auth.logout()
	};

	$scope.signedIn = function () {
		return Auth.signedIn();
	};
	
});