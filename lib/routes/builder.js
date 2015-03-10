"use strict"


var _ = require('lodash');
var Q = require('q');

var routesAuth = require('../routes/auth.js')


var crudify = require('../crudify.js');


var buildRoute = function(app, route, path, config, ctrl, collections, db){

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



		if(config._meta && config._meta.access){

			// set up routes
			app.route('/'+path)
				.get(routesAuth.secureEndpoint('list',config._meta.access),methods.list(prefs,config._meta || {}))
				.post(routesAuth.secureEndpoint('create',config._meta.access),methods.create);

			app.route('/'+path+'/:'+collectionId)
				.get(routesAuth.secureEndpoint('view',config._meta.access),methods.read)
				.put(routesAuth.secureEndpoint('update',config._meta.access),methods.update)
				.delete(routesAuth.secureEndpoint('delete',config._meta.access),methods.delete);

		} else {

			// set up routes
			app.route('/'+path)
				.get(methods.list)
				.post(methods.create);

			app.route('/'+path+'/:'+collectionId)
				.get(methods.read)
				.put(methods.update)
				.delete(methods.delete);

		}

		// id param
		app.param(collectionId, defaultCtrl.getByID);

		console.log("Added endpoint: /"+path);


	}

	// handle sub routes
	var subroutes = _.extend({},config);
	delete(subroutes._meta);
	for(var subroute in subroutes){

		var subpath = path;
		var subconfig = subroutes[subroute];

		if(subconfig._meta && subconfig._meta.hookAt && subconfig._meta.hookAt=="document"){
			subpath += "/:" + collectionId;		
		}
		
		subpath += "/" + subroute;
		
		if(config._meta.virtual){
			var tmpMeta = _.extend({}, config._meta);
			tmpMeta.virtual = false;
			if(subconfig._meta){
				subconfig._meta = _.extend(subconfig._meta, tmpMeta);
			} else {
				subconfig._meta = tmpMeta;
			}
			
		}
		buildRoute(app, subroute, subpath, subconfig, ctrl, collections, db);
	}

}

exports.buildRoute = buildRoute;
