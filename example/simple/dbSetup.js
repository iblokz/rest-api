'use strict';

module.exports = function(db) {
	const User = db.model('User');
	const Article = db.model('Article');

	const mock = {
		user: {
			name: 'John Doe',
			email: 'test@test.com',
			password: 'secret'
		},
		articles: [{
			title: 'Test Article',
			body: 'Test Test'
		}, {
			title: 'Test Article 1',
			body: 'Test Test Test'
		}]
	};

	User.find().exec().then(users =>
		// if users empty create test data
		(users.length === 0)
			? User.create(mock.user).then(user =>
				Article.create(mock.articles.map(article => Object.assign({}, article, {createdBy: user._id})))
					.then(articles => ({
						msg: 'Succesfuly imported example data',
						user,
						articles
					}))
				)
				.then(function(result) {
					console.log(result);
				}, function(errors) {
					console.log(errors);
				})
			: true
	);
};
