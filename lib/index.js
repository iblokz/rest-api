'use strict';

// load the things we need
const mongoose = require('mongoose');

const schemaParser = require('./schema/parser.js');
const routeBuilder = require('./route/builder.js');
const routeAuth = require('./middleware/auth.js');
const crudMiddleware = require('./middleware/crud');
const errorMiddleware = require('./middleware/error');

const defaultOptions = {
	silent: false,
	handleError: true,
	handleResponse: true
};

const loadModel = (map, db = mongoose, extensions = {}) => {
	// backwards compatibility
	const collections = (map.collections || map.routes) ? map.collections : map;
	const options = Object.assign({}, defaultOptions, map.options || {});

	Object.keys(collections)
		.map(collection => ({collection, prefs: collections[collection]}))
		// only generate model if schema is present
		.filter(({prefs}) => prefs['schema'])
		// parse schema
		.map(({collection, prefs}) => ({
			collection, prefs,
			schema: schemaParser.parse(prefs['schema'], db, false, prefs['options'] || {})
		}))
		// extend schema
		.map(({collection, prefs, schema}) => ({
			collection, prefs,
			schema: (extensions[collection] && extensions[collection] instanceof Function)
				? extensions[collection](schema, prefs, db)
				: schema
		}))
		// load model
		.forEach(({prefs, schema}) => (
			db.model(prefs['model'], schema),
			((options.silent === false) && console.log(prefs['model'] + ' model loaded'))
		));
};

/**
 * init routes based on configuration map and overrides
 * @param  {Object} app       express.js app instance
 * @param  {{collections: Object, options: Object, routes: Object}} map a rest api configuration map
 * @param  {Object} overrides endpoint controller methods overrides
 * @param  {Object} db        mongoose instance
 * @return {Object}           returns the app instance
 */
const initRoutes = function(app, map, overrides, db) {
	// extend the default options in the map
	map = Object.assign({}, map, {options: Object.assign({}, defaultOptions, map.options || {})});

	app.use(
		// routeBuilder.buildRoute(map, overrides, db, [])
		routeBuilder.buildRoute(map, overrides, db, [])
	);

	if (map.options.handleError === true) app.use(errorMiddleware);

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
	// exposed sub modules
	schemaParser,
	routeBuilder,
	routeAuth,
	crudMiddleware
};
