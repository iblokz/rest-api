'use strict';

var mongoose = require('mongoose');

var schemaValidator = require('./validator');

var Mixed = mongoose.Schema.Types.Mixed;
var ObjectId = mongoose.Schema.ObjectId;

const strTypeObjMap = {
	string: String,
	number: Number,
	boolean: Boolean,
	date: Date,
	buffer: Buffer,
	objectid: ObjectId,
	mixed: Mixed
};

const parseType = type => {
	// typeInArray
	var typeInArray = false;
	if (type instanceof Array && type.length === 1 && typeof (type[0]) === 'string') {
		typeInArray = true;
		type = type[0];
	}

	// string to type object
	var newType = strTypeObjMap[type.toLowerCase()] || false;

	if (typeInArray) newType = [newType];

	return newType;
};

var parseNode = function(conf) {
	var type = conf['type'];

	var schemaObj = {};
	schemaObj['type'] = parseType(type);

	// TODO: add a custom type handling mechanic
	if (type === 'date') {
		if (conf['default'] && conf['default'] === 'Date.now') {
			schemaObj['default'] = Date.now;
		}
	}

	// ref
	if (conf['ref']) schemaObj['ref'] = conf['ref'];

	// validators
	// required
	if (conf['required']) schemaObj['required'] = conf['required'];

	// Number
	if (type === 'number') {
		if (conf['min']) schemaObj['min'] = conf['min'];
		if (conf['max']) schemaObj['max'] = conf['max'];
	}

	// unique
	if (typeof conf['unique'] !== 'undefined') schemaObj['unique'] = conf['unique'];

	// index
	if (typeof conf['index'] !== 'undefined') schemaObj['index'] = conf['index'];

	return schemaObj;
};

const parseSchema = function(schemaStr, db, returnJson) {
	let schemaDef = {};

	let validationDict = {};

	for (let node in schemaStr) {
		// if schema node is an object
		if (schemaStr[node].constructor === Object) {
			if (schemaStr[node]['type']) {
				// check for validators
				schemaValidator.validators.forEach(function(validator) {
					if (typeof schemaStr[node][validator] !== 'undefined') {
						validationDict[node] = validationDict[node] || {};
						validationDict[node][validator] = schemaStr[node][validator];
						delete schemaStr[node][validator];
					}
				});

				// parse node
				schemaDef[node] = parseNode(schemaStr[node]);
			} else {
				// sub schemaStr
				schemaDef[node] = parseSchema(schemaStr[node], db, true);
			}
		// if it is an array
		} else if (schemaStr[node] instanceof Array) {
			if (schemaStr[node][0] && typeof schemaStr[node][0] === 'string') {
				let type = parseType(schemaStr[node][0]);
				if (type) schemaDef[node] = [type];
			} else {
				schemaDef[node] = [parseSchema(schemaStr[node][0], db)];
			}
		} else if (schemaStr[node] === false || schemaStr[node] === true) {
			schemaDef[node] = schemaStr[node];
		} else {
			let type = parseType(schemaStr[node]);
			if (type) {
				schemaDef[node] = type;
			}
		}
	}

	if (typeof returnJson !== 'undefined' && returnJson === true) {
		return schemaDef;
	}

	var schema = (typeof db === 'undefined')
		? mongoose.Schema(schemaDef)
		: db.Schema(schemaDef);

	Object.keys(validationDict).map(node =>
		Object.keys(validationDict[node]).map(validator =>
			schemaValidator.validate(validator, validationDict[node][validator], schema, node)));

	return schema;
};

exports.parse = parseSchema;
