"use strict"

var mongoose = require('mongoose'),
	path = require('path'),
	_ = require('lodash'),
	Q = require('q');


module.exports = function(model, db){
	

	var Store = (db) ? db.model(model) : mongoose.model(model);
	
	var crud = {};

	crud.promiseCreate = function(params){

		var deferred = Q.defer();
		
		var store = new Store(params);

		store.save(function(err) {
			if (err) {
				deferred.reject({
					errors: err.errors,
					store: store
				});
			} else {
				deferred.resolve(store);
			}
		});

		return deferred.promise;
	}
	
	crud.create = function(req, res) {

		var params = _.clone(req.body);

		if(req.user && req.user._id)
			params.createdBy = req.user._id;


		crud.promiseCreate(params).then(function(store){
			res.jsonp(store);
		},function(err){
			res.jsonp(err);
		})

	};

	/**
	 * Show the current document
	 */
	crud.read = function(req, res) {
		res.jsonp(req.store);
	};

	/**
	 * Update a document
	 */
	crud.update = function(req, res) {
		
		var store = req.store;

		store = _.extend(store, req.body);
		//console.log(store, req.body);
		
		store.save(function(err) {
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

	/**
	 * Delete a document
	 */
	crud.delete = function(req, res) {
		var store = req.store;

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
				start: 0,
				limit: 10
			}
		}
		
		// match
		query.push({ $match: queryMatch });
		countQuery.push({ $match: queryMatch })


		
		// limit
		if(querySlice.limit && querySlice.limit > 0)
			query.push({ $limit: querySlice.limit });

		if (queryProject)
			query.push({ $project: queryProject});

		if (querySort)
			query.push({ $sort: querySort});

		// start (skip)
		if(querySlice.start)
			query.push({ $skip: querySlice.start-1 });


		
		// count aggregation
		countQuery.push({ $group: { _id: null, count: { $sum: 1 } } })

		//console.log('Query: ' + JSON.stringify(countQuery));
				
		Store.aggregate(countQuery, function(err, result) {
			if (err) {
				console.log(err);
				deferred.reject({
					status: 500,
					err: err
				});
			} else {
				//console.log({countResult: result});
				if(result[0] && result[0]['count']){
					total = result[0]['count'];
				}

				//console.log('Query: ' + JSON.stringify(query));
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
				start: 0,
				limit: 10
			};

			var queryMatch = {};

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
			}

			crud.promiseList(queryMatch,querySlice).then(function(result){
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
				if (!store) return next(new Error('Failed to load ' + id));
				req.store = store;
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