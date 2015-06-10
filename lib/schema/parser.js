"use strict"

var mongoose = require('mongoose');
var _ = require('lodash');
var Q = require('q');

var schemaValidator = require('./validator');

var Mixed = mongoose.Schema.Types.Mixed;
var ObjectId = mongoose.Schema.ObjectId;

var parseType = function(type){

	var typeInArray = false;
	if(
		Object.prototype.toString.call(type)=="[object Array]"
		&& type.length === 1 && typeof(type[0]) === "string"
	) {
		typeInArray = true;
		type = type[0];
	}

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

	if(typeInArray){
		newType = [newType];
	}

	return newType;
}

var parseNode = function(conf){
	var schemaObj = {};
	schemaObj['type'] = parseType(type);
	// TODO: add a custom type handling mechanic
	if(type == 'date'){
		if(conf['default'] && conf['default'] == 'Date.now'){
			schemaObj['default'] = Date.now; 
		}
	}

	// validators
	// required
	if(conf['required']){
		schemaObj['required'] = conf['required'];
	}

	// Number
	if(type == 'number'){
		if(conf['min']){
			schemaObj['min'] = conf['min'];
		}
		if(conf['max']){
			schemaObj['max'] = conf['max'];
		}
	}

	// unique
	if(typeof conf["unique"] !== "undefined"){
		schemaObj['unique'] = conf["unique"];  
	}

	if(typeof conf["index"] !== "undefined"){
		schemaObj['index'] = conf["index"];  
	}

	return schemaObj;
}

var parseSchema = function(schemaStr, db, returnJson){
	

	var schemaDef = {};

	var validationDict = {};

	for(var node in schemaStr) {
		if(Object.prototype.toString.call(schemaStr[node])=="[object Object]") {
			if(schemaStr[node]['type']){
				

				// check for validators
				schemaValidator.validators.forEach(function(validator){
					if(typeof schemaStr[node][validator] != "undefined"){
						validationDict[node] = validationDict[node] || {};
						validationDict[node][validator] = schemaStr[node][validator];
						delete schemaStr[node][validator];
					}
				})

				// parse node
				schemaDef[node] = parseNode(schemaStr[node]);

			} else {
				// sub schemaStr
				schemaDef[node] = parseSchema(schemaStr[node], db, true);
			}
		} else if (Object.prototype.toString.call(schemaStr[node])=="[object Array]") {
			if(schemaStr[node][0] && typeof(schemaStr[node][0])=="string"){
				var type = parseType(schemaStr[node][0]);
				if(type) {
					schemaDef[node] = [type];
				}
			} else {
				schemaDef[node] = [parseSchema(schemaStr[node][0], db)];
			}
		} else {
			if(schemaStr[node] === false || schemaStr[node] === true){
				schemaDef[node] = schemaStr[node];
			} else {
				var type = parseType(schemaStr[node]);
				if(type) {
					schemaDef[node] = type;
				}
			}
		}
	}

	if(typeof returnJson != "undefined" && returnJson === true){
		return schemaDef;
	}

	var schema = (typeof db !== "undefined") 
		? db.Schema(schemaDef)
		: mongoose.Schema(schemaDef);

	_.forIn(validationDict,function(validators, node){
		_.forIn(validators, function(value, validator){
			//console.log(validator, value, node);
			schemaValidator.validate(validator, value, schema, node);
		})
	})
	
	return schema;
}

exports.parse = parseSchema;