'use strict'

var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var path = require('path');
var fileUtil = require('../util/file');

module.exports = function() {

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// Initialize strategies
	fileUtil.walk('./config/strategies', /(.*)\.(js$|coffee$)/).forEach(function(strategyPath) {
		require(path.resolve(strategyPath))();
	});
};