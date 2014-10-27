"use strict"

// load the things we need
var mongoose = require('mongoose');
var crudify = require('./crudify.js');
var Q = require('q');

var parseLine = function(key, type, arr){
	switch(type){
		case "String":
			arr[key] = String;
			break;
		case "Date":
			arr[key] = Date
			break;

	}
}

var parseSchema = function(schema){
	
	var newSchema = {};

	for(var i in schema) {

		if(typeof(schema[i])=="object", schema[i]['type']) {
			parseLine(i, schema[i]['type'], newSchema);
		} else {
			parseLine(i, schema[i], newSchema);
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
		// only works with get
		if(prefs['collectionCtrls'] && ctrl && ctrl[collection]){
			for(var i in prefs['collectionCtrls']){
				var collectionCtrl = prefs['collectionCtrls'][i];
				if(ctrl[collection][collectionCtrl]){
					app.route('/'+collection+'/'+collectionCtrl)
						.get(ctrl[collection][collectionCtrl])
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