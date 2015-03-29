"use strict"


var _ = require('lodash');
var Q = require('q');

var secureEndpoint = function(section, accessConfig, redirect){

	return function(req, res, next) {
		if (!req.isAuthenticated()) {
			var msg = 'User is not logged in';

			if(redirect){
				return res.redirect(redirect+'?msg='+msg)
			}

			return res.status(401).send({
				message: msg
			});
		}

		var role = req.user.role;
		//console.log(section, accessConfig, req.user.role);
		
		if (accessConfig[role] == "all")  {
			next();
		} else if (accessConfig[role] == "own")  {
			req.query.createdBy = req.user._id;
			next();
		} else if (accessConfig[role].split(",").indexOf(section)>-1) {
			next();
		} else {
			var msg = 'User is not authorized';

			if(redirect){
				return res.redirect(redirect+'?msg='+msg)
			}

			return res.status(403).jsnp({
				message: msg
			});
		}
	};


}

exports.secureEndpoint = secureEndpoint;