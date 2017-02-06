'use strict';

app.controller('ArticlesCtrl', function ($scope, Article) {
	$scope.articles = [];
	$scope.article = {};

	$scope.load = function() {
		Article.query().$promise.then(function(articles) {
			$scope.articles = articles;
		});
	};

	$scope.clear = function() {
		$scope.article = new Article();
	};

	$scope.edit = function(article) {
		$scope.article = article;
	};

	$scope.save = function() {
		if ($scope.article._id) {
			Article.update({_id: $scope.article._id}, $scope.article).$promise.then(function() {
				$scope.load();
			});
		// $scope.signal.$save().then($scope.load);
		} else {
			var article = $scope.article;
			Article.save(article).$promise.then(function() {
				$scope.load();
			});
		}
		$scope.clear();
	};

	$scope.delete = function(article) {
		if (article._id) {
			Article.delete({_id: article._id}).$promise.then(function() {
				$scope.load();
			});
		}
		$scope.clear();
	};

	$scope.load();
});
