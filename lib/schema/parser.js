'use strict';

const mongoose = require('mongoose');
const Mixed = mongoose.Schema.Types.Mixed;
const ObjectId = mongoose.Schema.ObjectId;

const {obj} = require('iblokz-data');

var schemaValidator = require('./validator');

const strTypeObjMap = {
	string: String,
	number: Number,
	boolean: Boolean,
	date: Date,
	buffer: Buffer,
	objectid: ObjectId,
	mixed: Mixed
};

const typeProps = {
	common: ['unique', 'index', 'required'],
	objectid: ['ref'],
	number: ['min', 'max'],
	string: [
		'minLength', 'maxLength', 'enum',
		'uppercase', 'lowercase', 'trim',
		{
			prop: 'match',
			parse: val => new RegExp(val)
		}
	],
	date: [
		'min', 'max',
		{prop: 'default', parse: val => val === 'Date.now' ? Date.now : val}
	]
};

const parseType = type => (
	// console.log(type),
	// type in array
	(type instanceof Array && type.length === 1 && typeof (type[0]) === 'string')
		&& [strTypeObjMap[type[0].toLowerCase()]]
		|| strTypeObjMap[type.toLowerCase()]
		|| false
);

// parse conf field to mongoose schema
const parseField = conf => [].concat(typeProps[conf.type.toLowerCase()], typeProps.common)
	.map(prop => typeof prop === 'string' ? {prop, parse: v => v} : prop)
	// .map(prop => (console.log(prop, conf), prop))
	.filter(({prop}) => typeof conf[prop] !== 'undefined')
	.reduce(
		(schema, {prop, parse}) => obj.patch(schema, prop, parse(conf[prop])),
		{type: parseType(conf.type)}
	);

const parseSchema = function(schemaStr, db = mongoose, returnJson = false, options = {}) {
	let schemaDef = {};

	let validationDict = {};

	for (let field in schemaStr) {
		// if schema field is an object
		if (schemaStr[field].constructor === Object) {
			if (schemaStr[field]['type'] && !schemaStr[field]['type']['type']) {
				// check for validators
				schemaValidator.validators.forEach(function(validator) {
					if (typeof schemaStr[field][validator] !== 'undefined') {
						validationDict[field] = validationDict[field] || {};
						validationDict[field][validator] = schemaStr[field][validator];
						delete schemaStr[field][validator];
					}
				});

				// parse field
				schemaDef[field] = parseField(schemaStr[field]);
			} else {
				// sub schemaStr
				schemaDef[field] = parseSchema(schemaStr[field], db, true);
			}
		// if it is an array
		} else if (schemaStr[field] instanceof Array) {
			// array of fields
			if (schemaStr[field].length === 1) {
				// string type definition [String]
				if (typeof schemaStr[field][0] === 'string') {
					let type = parseType(schemaStr[field][0]);
					if (type) schemaDef[field] = [type];
				// array type definition [{type: String}]
				} else if (schemaStr[field][0].constructor === Object && schemaStr[field][0].type && !schemaStr[field][0].type.type) {
					schemaDef[field] = [parseField(schemaStr[field][0])];
				// subcollection
				} else {
					schemaDef[field] = [parseSchema(schemaStr[field][0], db)];
				}
			}
		} else if (schemaStr[field] === false || schemaStr[field] === true) {
			schemaDef[field] = schemaStr[field];
		} else {
			let type = parseType(schemaStr[field]);
			if (type) {
				schemaDef[field] = type;
			}
		}
	}

	if (returnJson) return schemaDef;

	let schema = db.Schema(schemaDef, options);

	Object.keys(validationDict).map(field =>
		Object.keys(validationDict[field]).map(validator =>
			schemaValidator.validate(validator, validationDict[field][validator], schema, field)));

	return schema;
};

module.exports = {
	parseType,
	parseField,
	parse: parseSchema
};
