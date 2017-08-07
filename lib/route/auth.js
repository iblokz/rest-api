'use strict';

const msg = {
	notLoggedIn: 'User is not logged in',
	notAuthorized: 'User is not authorized'
};

const contains = (a, el) => [].concat(
	typeof a === 'string' && a.split(',')
	|| a instanceof Array && a
	|| []
).indexOf(el) > -1;

const secureEndpoint = (section, config, redirect) =>
	(req, res, next) => {
		if (!req.isAuthenticated() && !config.access['anonymous'])
			return redirect
				? res.redirect(`${redirect}?msg=${msg.notLoggedIn}`)
				: res.status(401).json({
					message: msg.notLoggedIn
				});

		let role = req.user && req.user.role || 'anonymous';
		// console.log(section, config.access, req.user.role);

		// if user has full access or access to the specific endpoint
		if (
			config.access[role] === "all" || contains(config.access[role], section)
		) return next();

		if (contains(config.access[role], 'own')) {
			req.access = req.access || {};
			req.access.createdBy = req.user._id;
		}
		if (contains(config.access[role], 'assigned')) {
			req.access = req.access || {};
			req.access.assignedTo = req.user._id;
			req.access.assigned = [].concat(config.assigned || 'assigned');
		}

		// console.log(req.access);

		if (req.access) return next();

		return redirect
				? res.redirect(`${redirect}?msg=${msg.notAuthorized}`)
				: res.status(403).json({
					message: msg.notAuthorized
				});
	};

exports.secureEndpoint = secureEndpoint;
