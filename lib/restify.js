"use strict"

// load the things we need
var mongoose = require('mongoose');
var crudify = require('./crudify.js');
var Q = require('q');

var Mixed = mongoose.Types.Mixed;
var ObjectId = mongoose.Schema.ObjectId;

var parseType = function(type){

	var  newType = false;
	switch (type.toLowerCase()) {
		case 'string': newType = String; break;
		case 'number': newType = Number; break;
		case 'boolean': newType = Boolean; break;
		case 'date': newType = Date; break;
		case 'buffer': newType = Buffer; break;
		case 'objectid': newType = ObjectId; break;
		case 'mixed': newType = Mixed; break;
	}

	return newType;
}

var parseSchema = function(schema){
	
	var newSchema = {};

	for(var i in schema) {
		if(Object.prototype.toString.call(schema[i])=="[object Object]") {
			if(schema[i]['type']){
				var type = schema[i]['type'].toLowerCase();
				var schemaObj = {};
				schemaObj['type'] = parseType(type);
				// TODO: add a custom type handling mechanic
				if(type == 'Date'){
					if(schema[i]['default'] && schema[i]['default'] == 'Date.now'){
						schemaObj['default'] = Date.now; 
					}
				}
				if(schemaObj['type']) {
					newSchema[i] = schemaObj;
				}
			} else {
				newSchema[i] = parseSchema(schema[i]);
			}
		} else if (Object.prototype.toString.call(schema[i])=="[object Array]") {
			if(schema[i][0] && typeof(schema[i][0])=="string"){
				var type = parseType(schema[i]);
				if(type) {
					newSchema[i] = [type];
				}
			} else {
				newSchema[i] = [parseSchema(schema[i][0])];
			}
		} else {
			var type = parseType(schema[i]);
			if(type) {
				newSchema[i] = type;
			}
		}
	}

	return newSchema;
}

var loadModel = function(map, db){

	for(var collection in map){
		var prefs = map[collection];
		var model = (db) ? db.model(prefs['model'],parseSchema(prefs['schema'])) : mongoose.model(prefs['model'], parseSchema(prefs['schema']));
		console.log(prefs['model']+ ' model loaded');
	}


}

var initRoutes = function(app, map, ctrl, db){

	for(var collection in map){
		var prefs = map[collection];
		
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
		app.route('/'+collection)
			.get(methods.list)
			.post(methods.create);

		app.route('/'+collection+'/:'+collectionId)
			.get(methods.read)
			.put(methods.update)
			.delete(methods.delete);

		

		// id param
		app.param(collectionId, defaultCtrl.getByID);



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