'use strict';

const {obj, str, fn} = require('iblokz-data');
const express = require('express');

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

const attachMiddleware = (ctrl, prefs, meta = {}, response) =>
	(router, {method, verb}) =>
		router[verb].apply(router, [].concat(
		// secure endpoints
		(meta.access) ? auth.secureEndpoint(method, meta) : [],
		// process method
		ctrl[method](prefs, meta),
		// response
		response instanceof Function ? response(method) : []
	));

// traverse map and build meta for specific path
// whileVirtual specifies if we are traversing backwards
const getMeta = (map, routePath, whileVirtual = false) => fn.pipe(
	() => obj.sub(map.routes, [].concat(routePath, '_meta')) || {},
	meta => (meta.virtual === whileVirtual)
		? Object.assign({}, getMeta(map, routePath.slice(0, -1), true), meta)
		: whileVirtual === true ? {} : meta,
	meta => whileVirtual === true
		? obj.filter(meta, key => key !== 'virtual')
		: meta
)();

const strToDocumentId = s => ''.concat(str.pluralToSingular(str.toCamelCase(s, '-')), 'Id');
const getDocumentId = (meta, route) =>
	meta.documentId || strToDocumentId(meta.collection || route);

/*
 * app - express instance
 * route - endpoint string
 * path - path string incl. endpoint
 * config - meta & subendpoints
 * ctrl / overrides -> middleware overrides from collection based to purpose based
 * map.collections -> map.collections config, from restMap
 * db -> mongoose instance -> needs to be examined cause it's being depricated,
 * map.options -> from restMap
*/

const buildRoute = function(map, overrides, db, routePath = [], meta = {}) {
	const router = express.Router();

	const route = routePath.slice(-1).pop();

	// handle current route
	if (route && !meta.virtual && !route.match(/^:[a-zA-Z]+$/)) {
		const collection = meta.collection || route;
		const prefs = map.collections[collection];
		const defaultCtrl = crud.init(prefs['model'], db);
		const documentId = getDocumentId(meta, route);

		// prepare rest methods
		var methods = [].concat(keys(restVerbs.collection), keys(restVerbs.document))
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
					? `:${getDocumentId(meta, route)}`
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
