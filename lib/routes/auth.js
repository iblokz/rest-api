"use strict"


var _ = require('lodash');
var Q = require('q');

var secureEndpoint = function(section, accessConfig){

	return function(req, res, next) {
		if (!req.isAuthenticated()) {
			return res.status(401).send({
				message: 'User is not logged in'
			});
		}

		var role = req.user.role;

		
		if (accessConfig[role] == "all")  {
			next();
		} else if (accessConfig[role] == "own")  {
			req.query.createdBy = req.user._id;
			next();
		} else if (accessConfig[role].split(",").indexOf(section)>-1) {
			next();
		} else {
			return res.status(403).send({
				message: 'User is not authorized'
			});
		}
	};


}

exports.secureEndpoint = secureEndpoint;