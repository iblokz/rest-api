"use strict"

// load the things we need
var mongoose = require('mongoose');


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

var defaultCtrl = {};

defaultCtrl.list = function(req, res){
	var	query = [],
			countQuery = [],
			queryMatch = {},
			queryStart = 1,
			queryLimit = 10,
			total = 0;

	// filters
	if(req.query){
		if(req.query.start){
			queryStart = parseInt(req.query.start);
		}

		if(req.query.limit){
			queryLimit = parseInt(req.query.limit);
		}
	}

	// match
	query.push({ $match: queryMatch });
	countQuery.push({ $match: queryMatch })


	// start (skip)
	if(queryStart)
		query.push({ $skip: queryStart-1 });

	// limit
	if(queryLimit)
		query.push({ $limit: queryLimit });

	// sort
	//query.push({ $sort: { startDate: -1 } });

	// count aggregation
	countQuery.push({ $group: { _id: null, count: { $sum: 1 } } })


	req.model.aggregate(countQuery, function(err, result) {
		if (err) {
			res.jsonp('error', {
				status: 500,
				err: err
			});
		} else {
			//console.log({countResult: result});
			if(result[0] && result[0]['count']){
				total = result[0]['count'];
			}

			req.model.aggregate(query, function(err, list) {
				if (err) {
					res.jsonp('error', {
						status: 500,
						err: err
					});
				} else {
					res.jsonp({
						total: total,
						start: queryStart,
						limit: queryLimit,
						list: list
					});
				}
			});
		}
	});
}

defaultCtrl.get = function(req, res){
	res.jsonp(req.entity);	
}

defaultCtrl.create = function(req, res) {		
	
	var entity = new req.model(req.body);

	console.log([req.model, req.body]);
	
	entity.save(function(err) {
		if (err) {
			res.jsonp({
				errors: err,
				body: entity
			});
		} else {
			res.jsonp(entity);
		}
	});
};



exports.apply = function(app, map, ctrl){

	for(var collection in map){

		var prefs = map[collection];

		var model = mongoose.model(prefs['model'], parseSchema(prefs['schema']));

		var addModel = function(model, prefs){
			return function(req, res, next){
				req.model = model;
				req.prefs = prefs;
				next();
			}
		}(model, prefs);

		var getDocById = function(model){
			return function(req, res, next){
				req.model.findById(req.params.id).exec(function(err, entity) {
					if (err) return next(err);
					if (!entity) return next(new Error('Failed to load entity ' + id));
					req.entity = entity;
					next();
				});
			}
		}(model)

		// list
		var listMethod = (ctrl && ctrl[collection] && ctrl[collection].list) ? ctrl[collection].list : defaultCtrl.list;
		console.log([collection,listMethod]);
		app.get("/"+collection, addModel, listMethod);

		// get
		var getMethod = (ctrl && ctrl[collection] && ctrl[collection].get) ? ctrl[collection].get : defaultCtrl.get;
		console.log([collection,getMethod]);
		app.get("/"+collection+"/:id",  addModel, getDocById, getMethod);

		// create
		var createMethod = (ctrl && ctrl[collection] && ctrl[collection].create) ? ctrl[collection].create : defaultCtrl.create;
		console.log([collection,createMethod]);
		app.post("/"+collection, addModel, createMethod);
	}

	return app;
}