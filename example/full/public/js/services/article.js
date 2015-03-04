app.factory('Article', ['$resource', function($resource) {
	
	var defaultActions = {
		save: {
			method: 'POST'
		},
		update: {
			method: 'PUT'
		},
		query: {
			method: 'GET',
			isArray: false
		}
	}

	var Article = $resource('/api/articles/:collectionRoute:_id/:memberRoute', { _id: '@_id' }, defaultActions);

	return Article;
}]);