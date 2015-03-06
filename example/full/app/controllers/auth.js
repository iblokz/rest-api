'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');
var config = require('../../config/config');
var mongoose = require('mongoose');
var passport = require('passport');
var User = mongoose.model('User');

exports.register = function(req, res) {
	
	if (config.userRoles.indexOf(req.body.role) == -1)
		delete req.body.role;

	// Init Variables
	var user = new User(req.body);
	var message = null;

	// Then save the user 
	user.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: err
			});
		} else {
			// Remove sensitive data before login
			user.password = undefined;
			user.salt = undefined;

			// TODO: redirect to thank you page
			

			//res.redirect('/');
			req.login(user, function(err) {
				if (err) {
					res.status(400).send(err);
				} else {
					res.status(200).jsonp({
						name: user.name,
						email: user.email,
						role: user.role
					});
				}
			});
		}
	});
};

/**
 * Login after passport authentication
 */
exports.login = function(req, res, next) {
	passport.authenticate('local', function(err, user, info) {
		if (err || !user) {
			res.status(400).send(info);
		} else {
			// Remove sensitive data before login
			user.password = undefined;
			user.salt = undefined;
			
			if(user.role != 'admin' && user.active === false){
				return res.status(401).send({
					message: 'User is not active yet!'
				});	
			}

			req.login(user, function(err) {
				if (err) {
					res.status(400).send(err);
				} else {
					if(user.role == 'admin'){
						res.status(200).jsonp({
							name: user.name,
							email: user.email,
							role: user.role
						});

					} else {
						res.status(200).jsonp({
							name: user.name,
							email: user.email,
							role: user.role
						});

					}
				}
			});
		}
	})(req, res, next);
};

/**
 * Logout
 */
exports.logout = function(req, res) {
	req.logout();
	res.jsonp('true');
};




exports.requiresLogin = function(role){
	return function(req, res, next) {
		if (!req.isAuthenticated()) {
			return res.status(401).send({
				message: 'User is not logged in'
			});
		}
		
		if (role)  {
			if(Object.prototype.toString.call( role ) === "[object Array]" &&
				role.indexOf(req.user.role) > -1){
				next();
			} else if (role === req.user.role) {
				next();
			} else {
				return res.status(403).send({
					message: 'User is not authorized'
				});
			}
		} else {
			next();
		}
	};
}