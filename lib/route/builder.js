'use strict';

const routesAuth = require('./auth.js');

const middleware = require('../crud/middleware');

const keys = Object.keys;

const restVerbs = {
	collection: {
		list: 'get',
		create: 'post'
	},
	document: {
		read: 'get',
		update: 'put',
		delete: 'delete'
	}
};

var buildRoute = function(app, route, path, config, ctrl, collections, db) {
	// handle current route
	if (!(config._meta && config._meta.virtual) && !route.match(/^:[a-zA-Z]+$/)) {
		const collection = config._meta && config._meta.collection || route;

		const prefs = collections[collection];

		// TODO: handle different endpoints - crud | view | custom
		// TODO: handle different content types - json | html

		const defaultCtrl = middleware.init(prefs['model'], db);

		const collectionId = prefs['model'].toLowerCase() + 'Id';

		// prepare rest methods
		var methods = [].concat(keys(restVerbs.collection), keys(restVerbs.document))
			.reduce((o, method) => Object.assign(o, {
				[method]: ctrl && ctrl[collection] && ctrl[collection][method] || defaultCtrl[method]
			}), {});

		// set up routes
		// collection
		keys(restVerbs.collection).map(method => ({method, verb: restVerbs.collection[method]}))
			.reduce((router, {method, verb}) => router[verb].apply(router, [].concat(
				// secure endpoints
				(config._meta && config._meta.access) ? [routesAuth.secureEndpoint(method, config._meta)] : [],
				[methods[method](prefs, config._meta || {})]
			)), app.route(`/${path}`));
		// document
		keys(restVerbs.document).map(method => ({method, verb: restVerbs.document[method]}))
			.reduce((router, {method, verb}) => router[verb].apply(router, [].concat(
				// secure endpoints
				(config._meta && config._meta.access) ? [routesAuth.secureEndpoint(method, config._meta)] : [],
				[methods[method]]
			)), app.route(`/${path}/:${collectionId}`));

		// id param
		app.param(collectionId, defaultCtrl.idParam);

		console.log("Added endpoint: /" + path);
	}

	// handle sub routes
	var subroutes = Object.assign({}, config);
	delete (subroutes._meta);
	for (var subroute in subroutes) {
		var subpath = path;
		var subconfig = subroutes[subroute];

		if (!route.match(/^:[a-zA-Z]+$/)) {
			let collection = config._meta.collection || route;
			// hookAt document
			if (subconfig._meta && subconfig._meta.hookAt && subconfig._meta.hookAt === "document") {
				const collectionId = collections[collection]['model'].toLowerCase() + 'Id';
				subpath += "/:" + collectionId;
			}
		}

		subpath += "/" + subroute;

		subconfig._meta = Object.assign({},
			config._meta && config._meta.virtual && Object.assign({}, config._meta, {virtual: false}) || {},
			subconfig._meta || {}
		);

		buildRoute(app, subroute, subpath, subconfig, ctrl, collections, db);
	}
};

exports.buildRoute = buildRoute;
