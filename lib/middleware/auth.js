'use strict';

const {arr} = require('iblokz-data');

const msg = {
	notLoggedIn: 'User is not logged in',
	notAuthorized: 'User is not authorized'
};

const secureEndpoint = (section, config, redirect) =>
	(req, res, next) => {
		if (!req.isAuthenticated() && !config.access['anonymous'])
			return redirect
				? res.redirect(`${redirect}?msg=${msg.notLoggedIn}`)
				: res.status(401).json({
					message: msg.notLoggedIn
				});

		let role = req.user && req.user.role || 'anonymous';

		// if user has full access or access to the specific endpoint
		if (config.access[role] === "all"
			|| arr.contains(config.access[role], section)
		) return next();

		if (arr.contains(config.access[role], 'own'))
			req.access = Object.assign(req.access || {}, {
				createdBy: req.user._id
			});

		if (arr.contains(config.access[role], 'assigned'))
			req.access = Object.assign(req.access || {}, {
				assignedTo: req.user._id,
				assigned: [].concat(config.assigned || 'assigned')
			});

		// console.log(req.access);

		if (req.access) return next();

		return redirect
				? res.redirect(`${redirect}?msg=${msg.notAuthorized}`)
				: res.status(403).json({
					message: msg.notAuthorized
				});
	};

exports.secureEndpoint = secureEndpoint;
