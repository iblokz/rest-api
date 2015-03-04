"use strict"

var app = angular.module('restify', [
	'ui.router',
	'ngResource',
	'ngCookies'
	]);

app.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', '$locationProvider',
	function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {

		$urlRouterProvider.otherwise('/');

		$stateProvider
			.state('home', {
				url : '/',
				templateUrl: '/partials/home.html'
			})

		$locationProvider.hashPrefix('!');

	}
]);