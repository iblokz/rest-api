'use strict';
/**
 * Route Builder
 * provides method to build specific endpoints
 * @module route/builder
 */

const {obj, str, fn} = require('iblokz-data');
const {Router} = require('express');

const auth = require('../middleware/auth.js');
const crud = require('../middleware/crud');
const response = require('../middleware/response');

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

/**
 * higher order function that attaches middleware
 * @param  {Object} 	ctrl    	controller collection with middleware methods
 * @param  {Object} 	prefs    	mongoose preferences from the schema
 * @param  {Object} 	meta			meta configuration from the endpoint
 * @param  {Function} response  optional handle response middleware
 * @return {Function}           reducer function
 */
const attachMiddleware = (ctrl, prefs, meta = {}, response) =>
	/**
	 * reducer function that attaches specific method to a specific http verb
	 * @param  {Router} router	express router
	 * @param  {String} method 	method name from the ctrl collection
	 * @param  {String} verb  	http verb
	 * @return {Object}  				the express router with the attached method
	 */
	(router, {method, verb}) =>
		router[verb].apply(router, [].concat(
		// secure endpoints
		(meta.access) ? auth.secureEndpoint(method, meta) : [],
		// process method
		ctrl[method](prefs, meta),
		// response
		response instanceof Function ? response(method) : []
	));

/**
 * traverse map and build meta for specific path
 * @param  {Object}  map            object tree map with http routes configuration
 * @param  {Array}   routePath      path to the current route in the tree map
 * @param  {Boolean} whileVirtual 	specifies if we are traversing backwards
 * @return {Object}                 generated meta object
 */
const getMeta = (map, routePath, whileVirtual = false) => fn.pipe(
	() => obj.sub(map.routes, [].concat(routePath, '_meta')) || {},
	meta => (meta.virtual === whileVirtual)
		? Object.assign({}, getMeta(map, routePath.slice(0, -1), true), meta)
		: whileVirtual === true ? {} : meta,
	meta => whileVirtual === true
		? obj.filter(meta, key => key !== 'virtual')
		: meta
)();

/**
 * builds an express router endpoint based on preferences, overrides, etc ...
 * @alias module:route/builder.buildRoute
 * @param  {{collections: Object, options: Object, routes: Object}} map a rest api configuration map
 * @param  {Object} overrides      middleware overrides [collection, method]
 * @param  {Object} db             mongoose instance (to be depricated)
 * @param  {Array} 	routePath			 path to the route endpoint the route map
 * @param  {Object} meta		       meta configuration from the endpoint
 * @return {Router}                express router instance holding the endpoint
 */
const buildRoute = function(map, overrides, db, routePath = [], meta = {}) {
	const router = new Router();
	const route = routePath.slice(-1).pop();
	const collection = meta.collection || route;
	const documentId = meta.documentId || collection && str.toDocumentId(collection, '-');

	// handle current route
	if (route && !meta.virtual && !route.match(/^:[a-zA-Z]+$/)) {
		const prefs = map.collections[collection];
		const defaultCtrl = crud.init(prefs['model'], db);
		// prepare rest methods
		let methods = [].concat(keys(restVerbs.collection), keys(restVerbs.document))
			.reduce((o, method) => Object.assign(o, {
				[method]: obj.sub(overrides, [collection, method]) || defaultCtrl[method]
			}), {});

		// set up rest endpoints
		// collection
		keys(restVerbs.collection)
			.map(method => ({method, verb: restVerbs.collection[method]}))
			.reduce(
				attachMiddleware(methods, prefs, meta, map.options.handleResponse && response),
				router.route(`/${route}`)
			);
		// document
		keys(restVerbs.document)
			.map(method => ({method, verb: restVerbs.document[method]}))
			.reduce(
				attachMiddleware(methods, prefs, meta, map.options.handleResponse && response),
				router.route(`/${route}/:${documentId}`)
			);

		// id param
		router.param(documentId, defaultCtrl.idParam(prefs, meta || {}));

		if (map.options.silent === false) console.log("Added endpoint: /" + routePath.slice(0, -1).concat(route).join('/'));
	}

	// build sub routes
	keys(obj.sub(map.routes, routePath) || map.routes)
		.filter(key => key !== '_meta')
		.forEach(subroute => fn.pipe(
			() => getMeta(map, [].concat(routePath, subroute)),
			submeta => ({submeta, subpath: [].concat(
				route,
				(submeta.hookAt === 'document' && !route.match(/^:[a-zA-Z]+$/))
					? `:${documentId}`
					: []
			).join('/')}),
			({subpath, submeta}) => router.use(`/${subpath}`,
				buildRoute(map, overrides, db, [].concat(routePath, subroute), submeta))
		)());
	return router;
};

module.exports = {
	buildRoute
};
