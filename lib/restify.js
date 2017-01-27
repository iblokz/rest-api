'use strict';

// load the things we need
var mongoose = require('mongoose');

var crudify = require('./crudify.js');
var schemaParser = require('./schema/parser.js');
var routesBuilder = require('./route/builder.js');
var routesAuth = require('./route/auth.js');

const loadModel = (map, db) => {
	// backwards compatibility
	const collections = (map.collections || map.routes) ? map.collections : map;

	Object.keys(collections).forEach(collection => {
		const prefs = collections[collection];
		// only generate model if schema is present
		if (prefs['schema']) {
			// parse schema
			const schema = schemaParser.parse(prefs['schema'], db);
			// load model
			const model = (db)
				? db.model(prefs['model'], schema)
				: mongoose.model(prefs['model'], schema);
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

var initRoutes = function(app, map, ctrl, db) {
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
var apply = function(app, map, ctrl, db) {
	loadModel(map, db);
	app = initRoutes(app, map, ctrl, db);
};

module.exports = {
	loadModel: loadModel,
	initRoutes: initRoutes,
	apply: apply,
	// expose crudify
	crudify: crudify,
	routesAuth: routesAuth
};
