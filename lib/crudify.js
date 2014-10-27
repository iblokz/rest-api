"use strict"

var mongoose = require('mongoose'),
	path = require('path'),
	_ = require('lodash'),
	Q = require('q');


module.exports = function(model, db){
	

	var Store = (db) ? db.model(model) : mongoose.model(model);
	
	var crud = {};
	
	crud.create = function(req, res) {

		
		var store = new Store(req.body);
		
		if(req.user && req.user._id)
			store.createdBy = req.user._id;


		store.save(function(err) {
			if (err) {
				res.jsonp({
					errors: err.errors,
					store: store
				});
			} else {
				res.jsonp(store);
			}
		});
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
	
	
	crud.qCommonFind = function(req, queryMatch, queryProject, querySort, queryPopulate){
		
		var deferred = Q.defer();
		
		var	query = [],
			countQuery = [],
			queryStart = 1,
			queryLimit = 0,
			total = 0;
		
		if(!queryMatch)
			queryMatch = {};
		
		if(req && req.query){
			
			// common filters
			if(req.query.type && !queryMatch['type']){
				if(req.query.type.split(',').length>1)
					queryMatch['type'] = {$in: req.query.type.split(',')}
				else
					queryMatch['type'] = req.query.type;
			}
			
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
		if(queryLimit && queryLimit > 0)
			query.push({ $limit: queryLimit });

		// if (queryProject)
		// 	query.push({ $project: queryProject});

		
		// count aggregation
		countQuery.push({ $group: { _id: null, count: { $sum: 1 } } })


		Store.aggregate(countQuery, function(err, result) {
			if (err) {
				deferred.reject({
					status: 500,
					err: err
				});
			} else {
				//console.log({countResult: result});
				if(result[0] && result[0]['count']){
					total = result[0]['count'];
				}

				console.log('Query: ' + JSON.stringify(query));
				Store.aggregate(query, function(err, results) {
					if (err) {
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
										start: queryStart,
										limit: queryLimit,
										list: resPopulated
									});
								}
							});
						} else {
							deferred.resolve({
								total: total,
								start: queryStart,
								limit: queryLimit,
								list: results
							});
						}
						
					}
				});
			}
		});
		
		
		return deferred.promise;
		
	}
	
	crud.list = function(req, res){
		
		crud.qCommonFind(req).then(function(result){
			res.jsonp(result);
		},function(error){
			res.jsonp('error', error);
			
		})
		
	};
	
	crud.getByID = function(req, res, next, id) {
		Store.findById(id).exec(function(err, store) {
			console.log(err,store);
			if (err) return next(err);
			if (!store) return next(new Error('Failed to load ' + id));
			req.store = store;
			next();
		});
	};
	
	crud.parseId = function(id){
		return mongoose.Types.ObjectId(id);
		
	}
	
	return crud;
}