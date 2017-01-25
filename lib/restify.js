'use strict';

// load the things we need
var mongoose = require('mongoose');

var crudify = require('./crudify.js');
var schemaParser = require('./schema/parser.js');
var routesBuilder = require('./route/builder.js');
var routesAuth = require('./route/auth.js');

var loadModel = function(map, db) {
	// backwards compatibility
	var newMap = false;
	if (map.collections || map.routes) {
		newMap = true;
	}

	var collections = (newMap) ? map.collections : map;

	for (var collection in collections) {
		var prefs = collections[collection];
		// only generate model if schema is present
		if (prefs['schema']) {
			var schema = schemaParser.parse(prefs['schema'], db);
			var model = (db)
				? db.model(prefs['model'], schema)
				: mongoose.model(prefs['model'], schema);
			console.log(prefs['model'] + ' model loaded');
		}
	}
};

var initRoutes = function(app, map, ctrl, db) {
	// backwards compatibility
	var newMap = false;
	if (map.collections || map.routes) {
		newMap = true;
	}

	var collections = (newMap) ? map.collections : map;

	if (!newMap) {
		// in the old map routes == collections
		for (var route in collections){
			var config = {
				"_meta": {
					"crud": true,
					"contentType": "json"
				}
			};
			var path = route;
			routesBuilder.buildRoute(app, route, path, config, ctrl, collections, db);
		}
	} else {
		for (var route in map.routes){
			var config = map.routes[route];
			var path = route;
			routesBuilder.buildRoute(app, route, path, config, ctrl, collections, db);
		}
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
