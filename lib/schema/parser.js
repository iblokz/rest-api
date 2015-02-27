"use strict"

var mongoose = require('mongoose');
var _ = require('lodash');
var Q = require('q');

var Mixed = mongoose.Schema.Types.Mixed;
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
				var type = parseType(schema[i][0]);
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

exports.parse = parseSchema;