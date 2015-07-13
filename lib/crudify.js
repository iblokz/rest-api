"use strict"

var mongoose = require('mongoose'),
	path = require('path'),
	_ = require('lodash'),
	Q = require('q');


module.exports = function(model, db){
	

	var Store = (db) ? db.model(model) : mongoose.model(model);
	
	var crud = {};

	crud.promiseValidateAndSave = function(store){
		var deferred = Q.defer();
		store.validate(function(err){
			if (err) {
				deferred.reject(err);
			} else {

				store.save(function(err) {
					if (err) {
						deferred.reject(err);
					} else {
						deferred.resolve(store);
					}
				});
			}
		});
		return deferred.promise;
	}

	crud.promiseCreate = function(params){

		var deferred = Q.defer();
		
		var store = new Store(params);

		return crud.promiseValidateAndSave(store);
		
	}
	
	crud.create = function(prefs, config){
		return function(req, res){

			var doc = _.clone(req.body);

			if(req.user && req.user._id)
				doc.createdBy = req.user._id;

			if(config['hook']){
				if(config['hook']['hostParam'] && req.params[config['hook']['hostParam']] && config['hook']['linkField']){
					if(prefs.schema[config['hook']['linkField']] == "ObjectId"){
						doc[config['hook']['linkField']] = crud.parseId(req.params[config['hook']['hostParam']])
					} else {
						doc[config['hook']['linkField']] = req.params[config['hook']['hostParam']];
					}
				}
			}

			crud.promiseCreate(doc).then(function(store){
				res.jsonp(store);
			},function(err){
				res.status(500).jsonp(err);
			})

		};
	};

	/**
	 * Show the current document
	 */
	crud.read = function(req, res) {
		res.jsonp(req["store"+model]);
	};
	

	crud.promiseUpdate = function(params, store){

		if(!store && params['_id']){
			return crud.promiseStoreById(params['_id']).then(function(store){
				store = _.extend(store, params);
				return crud.promiseValidateAndSave(store)
			});
		}
		
		store = _.extend(store, params);
		return crud.promiseValidateAndSave(store);
		
	}

	/**
	 * Update a document
	 */
	crud.update = function(req, res) {
		
		var store = req["store"+model];

		//console.log(store, req.body);

		crud.promiseUpdate(req.body, store).then(function(store){
			res.jsonp(store);
		},function(err){
			res.status(500).jsonp(err);
		})

	};

	/**
	 * Delete a document
	 */
	crud.delete = function(req, res) {
		var store = req["store"+model];

		store.remove(function(err) {
			if (err) {
				res.jsonp('error', {
					status: 500,
					err: err
				});
			} else {
				res.jsonp(store);
			}
		});
	};
	
	
	crud.promiseList = function(queryMatch, querySlice, queryProject, querySort, queryPopulate){
		
		var deferred = Q.defer();
		
		var	query = [],
			countQuery = [],
			total = 0;
		
		if (!queryMatch) {
			queryMatch = {};
		}
		
		if (!querySlice) {
			querySlice = {
				start: 1,
				limit: 10
			}
		}
		
		// match
		query.push({ $match: queryMatch });
		countQuery.push({ $match: queryMatch })

		if (querySort)
			query.push({ $sort: querySort});

		if (queryProject)
			query.push({ $project: queryProject});

		// start (skip)
		if(querySlice.start)
			query.push({ $skip: querySlice.start-1 });
		
		// limit
		if(querySlice.limit && querySlice.limit > 0)
			query.push({ $limit: querySlice.limit });
				
		Store.count(queryMatch, function(err, total) {
			if (err) {
				console.log(err);
				deferred.reject({
					status: 500,
					err: err
				});
			} else {

				Store.aggregate(query, function(err, results) {
					if (err) {
						console.log(err);
						deferred.reject({
							status: 500,
							err: err
						});
					} else {
						if (queryPopulate) {

							var PopulateModel = mongoose.model(queryPopulate.model);
							PopulateModel.populate(results, queryPopulate.query, function(err, resPopulated) {
								if (err) {
									deferred.reject({
										status: 500,
										err: err
									});
								} else {
									deferred.resolve({
										total: total,
										start: querySlice.start,
										limit: querySlice.limit,
										list: resPopulated
									});
								}
							});
						} else {
							deferred.resolve({
								total: total,
								start: querySlice.start,
								limit: querySlice.limit,
								list: results
							});
						}
						
					}
				});
			}
		});
		
		
		return deferred.promise;
		
	}

	// backwards compatible
	crud.qCommonFind = crud.promiseList;
	
	crud.list = function(prefs, config){
		return function(req, res){

			var querySlice = {
				start: 1,
				limit: 10
			};

			var queryMatch = {};
			var queryProject = false;

			if(req.query){

				if(req.query.createdBy){
					queryMatch.createdBy = req.query.createdBy;
				}

				if(req.query.start){
					querySlice.start = parseInt(req.query.start);
				}

				if(req.query.limit){
					querySlice.limit = parseInt(req.query.limit);
				}



				if(prefs.searchable && req.query.search){
					var search = req.query.search;
					var searchRegEx = new RegExp(search.toLowerCase(), "i")
					
					if(req.query.searchField && req.query.searchField != "" && prefs.searchable.indexOf(req.query.searchField)>-1 ){
						queryMatch[req.query.searchField] = { $regex : searchRegEx};
						
					} else {
						queryMatch['$or'] = [];
						for (var i in prefs.searchable){
							var queryObj = {};
							queryObj[prefs.searchable[i]] = { $regex : searchRegEx};
							queryMatch['$or'].push(queryObj);
						}
					}
				}

				for(var field in prefs.schema){
					if(typeof req.query[field] !== "undefined" 
						&& typeof queryMatch[field] === "undefined"){
						queryMatch[field] = req.query[field];
					}
				}
			}

			if(config['hook']){
				if(config['hook']['hostParam'] && req.params[config['hook']['hostParam']] && config['hook']['linkField']){
					if(prefs.schema[config['hook']['linkField']] == "ObjectId"){
						queryMatch[config['hook']['linkField']] = crud.parseId(req.params[config['hook']['hostParam']])
					} else {
						queryMatch[config['hook']['linkField']] = req.params[config['hook']['hostParam']];
					}
				}
			}

			if(config['filters']){
				for(var filter in config['filters']){
					var value = config['filters'][filter];
					queryMatch[filter] = value;
				}
			}

			if(config['project']){
				queryProject = config['project'];
			}

			crud.promiseList(queryMatch,querySlice,queryProject).then(function(result){
				res.jsonp(result);
			},function(error){
				res.jsonp('error', error);
				
			})
			
		};
	}

	crud.promiseStoreById = function(id){

		var deferred = Q.defer();

		Store.findById(id).exec(function(err, store) {
			if(err) {
				deferred.reject(err) 
			} else {
				deferred.resolve(store);
			}
		});

		return deferred.promise;
	}
	
	crud.getByID = function(req, res, next, id) {
		crud.promiseStoreById(id).then(
			function(store){
				// todo add error handling middleware
				//if (!store) return next(new Error('Failed to load ' + id));
				req["store"+model] = store;
				next();
			},function(err){
				return next(err)
			});
	};
	
	crud.parseId = function(id){
		return mongoose.Types.ObjectId(id);
		
	}
	
	return crud;
}