'use strict';

const app = angular.module('restApi', [
	'ui.router',
	'ngResource',
	'ngCookies'
]);

app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider',
	function($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url: '/',
				templateUrl: '/partials/home.html'
			});

		$locationProvider.hashPrefix('!');
	}
]);
