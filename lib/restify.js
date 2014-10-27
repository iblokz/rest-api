"use strict"

// load the things we need
var mongoose = require('mongoose');
var crudify = require('./crudify.js');

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


exports.apply = function(app, map, ctrl, db){

	for(var collection in map){

		var prefs = map[collection];

		var model = (db) ? db.model(prefs['model'],parseSchema(prefs['schema'])) : mongoose.model(prefs['model'], parseSchema(prefs['schema']));
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