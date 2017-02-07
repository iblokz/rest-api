'use strict';

const msg = {
	notLoggedIn: 'User is not logged in',
	notAuthorized: 'User is not authorized'
};

const secureEndpoint = (section, accessConfig, redirect) =>
	(req, res, next) => {
		if (!req.isAuthenticated())
			return redirect
				? res.redirect(`${redirect}?msg=${msg.notLoggedIn}`)
				: res.status(401).json({
					message: msg.notLoggedIn
				});

		let role = req.user.role;
		// console.log(section, accessConfig, req.user.role);

		if (accessConfig[role] === "all") {
			next();
		} else if (accessConfig[role] === "own") {
			req.access = {};
			req.access.createdBy = req.user._id;
			next();
		} else if (accessConfig[role].split(",").indexOf(section) > -1) {
			next();
		} else {
			return redirect
				? res.redirect(`${redirect}?msg=${msg.notAuthorized}`)
				: res.status(403).json({
					message: msg.notAuthorized
				});
		}
	};

exports.secureEndpoint = secureEndpoint;
