'use strict';

// load the things we need
const mongoose = require('mongoose');

const schemaParser = require('./schema/parser.js');
const routesBuilder = require('./route/builder.js');
const routesAuth = require('./route/auth.js');

const loadModel = (map, db = mongoose, extensions = {}) => {
	// backwards compatibility
	const collections = (map.collections || map.routes) ? map.collections : map;

	Object.keys(collections).forEach(collection => {
		const prefs = collections[collection];
		// only generate model if schema is present
		if (prefs['schema']) {
			// parse schema
			let schema = schemaParser.parse(prefs['schema'], db, false, prefs['options'] || {});
			// extend schema
			if (extensions[collection] && extensions[collection] instanceof Function)
				schema = extensions[collection](schema, prefs, db);
			// load model
			db.model(prefs['model'], schema);
			console.log(prefs['model'] + ' model loaded');
		}
	});
};

const defaultRouteConfig = {
	_meta: {
		crud: true,
		contentType: 'json'
	}
};

const initRoutes = function(app, map, ctrl, db) {
	// backwards compatibility
	const newMap = (map.collections || map.routes);

	const collections = (newMap) ? map.collections : map;

	if (newMap) {
		Object.keys(map.routes).forEach(route =>
			routesBuilder.buildRoute(app, route, route, map.routes[route], ctrl, collections, db));
			// routesBuilder.buildRoute(app, route, path, config, ctrl, collections, db);
	} else {
		// in the old map routes == collections
		Object.keys(collections).forEach(route =>
			routesBuilder.buildRoute(app, route, route, defaultRouteConfig, ctrl, collections, db));
			// routesBuilder.buildRoute(app, route, path, config, ctrl, collections, db);
	}
	return app;
};

// backwards compatible
const apply = function(app, map, ctrl, db) {
	loadModel(map, db);
	app = initRoutes(app, map, ctrl, db);
};

module.exports = {
	loadModel,
	initRoutes,
	apply,
	routesAuth
};
