'use strict'

var config = require('../../config/config');

module.exports = function(app) {

	var auth = require('../controllers/auth');
	var users = require('../controllers/users');

	app.route('/api/login')
		.post(auth.login);

	app.route('/api/register')
		.post(auth.register);


	app.get('/api/logout', auth.logout);


	app.route('/profile')
		.get(auth.requiresLogin(config.userRoles),function(req, res){
			res.jsonp({
				name: req.user.name,
				email: req.user.email,
				role: req.user.role
			});
		})


};