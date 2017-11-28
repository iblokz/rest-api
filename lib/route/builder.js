'use strict';

const routesAuth = require('./auth.js');

const middleware = require('../crud/middleware');

var buildRoute = function(app, route, path, config, ctrl, collections, db) {
	// handle current route
	if (!config._meta.virtual) {
		const collection = config._meta.collection || route;

		const prefs = collections[collection];

		// TODO: handle different endpoints - crud | view | custom
		// TODO: handle different content types - json | html

		const defaultCtrl = middleware.init(prefs['model'], db);

		const collectionId = prefs['model'].toLowerCase() + 'Id';

		// console.log(collection, collectionId, prefs['model']);

		var methods = ['list', 'read', 'create', 'update', 'delete']
			.reduce((o, method) =>
				((o[method] = ctrl && ctrl[collection] && ctrl[collection][method] || defaultCtrl[method]), o),
				{}
			);

		// set up custom collection ctrls
		// -> /collection/collectionCtrl
		if (prefs['collectionCtrls'] && ctrl && ctrl[collection]) {
			for (let restMethod in prefs['collectionCtrls']) {
				restMethod = restMethod.toLowerCase();
				// if valid restMethod
				if (['get', 'post', 'put', 'delete'].indexOf(restMethod) > -1) {
					for (let i in prefs['collectionCtrls'][restMethod]) {
						var collectionCtrl = prefs['collectionCtrls'][restMethod][i];
						if (ctrl[collection][collectionCtrl]) {
							app[restMethod](`/${path}/${collectionCtrl}`, ctrl[collection][collectionCtrl]);
						}
					}
				}
			}
		}

		// set up custom document ctrls
		// -> /collection/:collectionId/documentCtrl
		if (prefs['documentCtrls'] && ctrl && ctrl[collection]) {
			for (let restMethod in prefs['documentCtrls']) {
				restMethod = restMethod.toLowerCase();
				// if valid restMethod
				if (['get', 'post', 'put', 'delete'].indexOf(restMethod) > -1) {
					for (var i in prefs['documentCtrls'][restMethod]) {
						var documentCtrl = prefs['documentCtrls'][restMethod][i];
						if (ctrl[collection][documentCtrl]) {
							app[restMethod](`/${path}/:${collectionId}/${documentCtrl}`, ctrl[collection][documentCtrl]);
						}
					}
				}
			}
		}

		if (config._meta && config._meta.access) {
			// set up routes
			app.route(`/${path}`)
				.get(
					routesAuth.secureEndpoint('list', config._meta),
					methods.list(prefs, config._meta || {}))
				.post(
					routesAuth.secureEndpoint('create', config._meta),
					methods.create(prefs, config._meta || {}));

			app.route(`/${path}/:${collectionId}`)
				.get(routesAuth.secureEndpoint('view', config._meta), methods.read)
				.put(routesAuth.secureEndpoint('update', config._meta), methods.update)
				.delete(routesAuth.secureEndpoint('delete', config._meta), methods.delete);
		} else {
			// set up routes
			app.route(`/${path}`)
				.get(methods.list(prefs, config._meta || {}))
				.post(methods.create(prefs, config._meta || {}));

			app.route(`/${path}/:${collectionId}`)
				.get(methods.read)
				.put(methods.update)
				.delete(methods.delete);
		}

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

		let collection = config._meta.collection || route;

		if (subconfig._meta && subconfig._meta.hookAt && subconfig._meta.hookAt === "document") {
			const collectionId = collections[collection]['model'].toLowerCase() + 'Id';
			subpath += "/:" + collectionId;
		}

		subpath += "/" + subroute;

		if (config._meta.virtual)
			subconfig._meta = Object.assign({}, subconfig._meta || {}, config._meta, {virtual: false});

		buildRoute(app, subroute, subpath, subconfig, ctrl, collections, db);
	}
};

exports.buildRoute = buildRoute;
