"use strict"

// load the things we need
var mongoose = require('mongoose');
var _ = require('lodash');
var Q = require('q');

var crudify = require('./crudify.js');
var schemaParser = require('./schema/parser.js')

var loadModel = function(map, db){

	// backwards compatibility
	var newMap = false;
	if(map.collections || map.routes){
		newMap = true;
	}


	var collections = (newMap) ? map.collections : map;

	for(var collection in collections){
		var prefs = collections[collection];
		var model = (db) ? db.model(prefs['model'], schemaParser.parse(prefs['schema'])) : mongoose.model(prefs['model'], schemaParser.parse(prefs['schema']));
		console.log(prefs['model']+ ' model loaded');
	}

}

var parseRoute = function(app, route, path, config, ctrl, collections, db){

	// handle current route
	if(!config._meta.virtual){

		var collection = config._meta.collection || route

		var prefs = collections[collection];

		// TODO: handle different endpoints - crud | view | custom
		// TODO: handle different content types - json | html
		
		var defaultCtrl = (db) ? crudify(prefs['model'],db) : crudify(prefs['model']);

		var collectionId = prefs['model'].toLowerCase()+'Id';

		//console.log(collection, collectionId, prefs['model']);
		
		var methods = { 
			'list': {},
			'read': {},
			'create': {}, 
			'update': {}, 
			'delete': {} 
		}
		
		// set up methods
		for (var i in methods){
			if(ctrl && ctrl[collection]) {
				methods[i] = (ctrl[collection][i]) ? ctrl[collection][i] : defaultCtrl[i];
			} else {
				methods[i] = defaultCtrl[i];
			}
		}

		// set up custom collection ctrls
		// -> /collection/collectionCtrl
		if(prefs['collectionCtrls'] && ctrl && ctrl[collection]){
			for(var restMethod in prefs['collectionCtrls']){
				restMethod = restMethod.toLowerCase();
				// if valid restMethod
				if(['get','post','put','delete'].indexOf(restMethod)>-1){
					for(var i in prefs['collectionCtrls'][restMethod]){
						var collectionCtrl = prefs['collectionCtrls'][restMethod][i];
						if(ctrl[collection][collectionCtrl]){
							app[restMethod]('/'+collection+'/'+collectionCtrl, ctrl[collection][collectionCtrl])
						}
					}
				}
			}
		}

		// set up custom document ctrls
		// -> /collection/:collectionId/documentCtrl
		if(prefs['documentCtrls'] && ctrl && ctrl[collection]){
			for(var restMethod in prefs['documentCtrls']){
				restMethod = restMethod.toLowerCase();
				// if valid restMethod
				if(['get','post','put','delete'].indexOf(restMethod)>-1){
					for(var i in prefs['documentCtrls'][restMethod]){
						var documentCtrl = prefs['documentCtrls'][restMethod][i];
						if(ctrl[collection][documentCtrl]){
							app[restMethod]('/'+collection+'/:'+collectionId+'/'+documentCtrl, ctrl[collection][documentCtrl])
						}
					}
				}
			}
		}

		// set up routes
		app.route('/'+path)
			.get(methods.list)
			.post(methods.create);

		app.route('/'+path+'/:'+collectionId)
			.get(methods.read)
			.put(methods.update)
			.delete(methods.delete);

		// id param
		app.param(collectionId, defaultCtrl.getByID);

		console.log("Added endpoint: /"+path);


	}

	// handle sub routes
	var subroutes = _.extend({},config);
	delete(subroutes._meta);
	for(var subroute in subroutes){
		var subpath = path + "/" + subroute;
		var subconfig = subroutes[subroute];
		if(config._meta.virtual){
			subconfig._meta = _.extend({}, config._meta);
			subconfig._meta.virtual = false;
		}
		parseRoute(app, subroute, subpath, subconfig, ctrl, collections, db);
	}

}

var initRoutes = function(app, map, ctrl, db){

	// backwards compatibility
	var newMap = false;
	if(map.collections || map.routes){
		newMap = true;
	}

	var collections = (newMap) ? map.collections : map;

	if(!newMap) {
		// in the old map routes == collections
		for (var route in collections){
			var config = {
				"_meta": {
					"crud": true,
					"contentType": "json"
				}
			};
			var path = route;
			parseRoute(app, route, path, config, ctrl, collections, db);
		}
	} else {
		for (var route in map.routes){
			var config = map.routes[route];
			var path = route;
			parseRoute(app, route, path, config, ctrl, collections, db);
		}
	}


	return app;
}

// backwards compatible
var apply = function(app, map, ctrl, db){
	loadModel(map, db);
	app = initRoutes(app, map, ctrl, db);
}

module.exports = {
	loadModel: loadModel,
	initRoutes: initRoutes,
	apply: apply,
	// expose crudify
	crudify: crudify
}