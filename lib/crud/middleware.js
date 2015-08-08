"use strict";

var mongoose = require('mongoose');
var	path = require('path');
var	_ = require('lodash');
var	Q = require('q');

function CrudMiddleware(model, db){
	this.store = (db) ? db.model(model) : mongoose.model(model);
}

// collection middleware
CrudMiddleware.prototype.list = function(req, res, next){
	
	var query = req.query || {};
	var Store = this.store;
	
	query = _.extend({
		match: {},
		slice: {
			start: 1,
			limit: 10
		}
	}, query);

	Store.count(query.match, function(err, total) {
		if (err) {
			return next(err)
		} else {
			var queryChain = Store.find(query.match);
			if (query.sort)
				queryChain.sort(query.sort);
			if (query.project)
				queryChain.project(query.project);
			if(query.populate)
				queryChain.populate(query.populate)
			if(query.slice && query.slice.start)
				queryChain.skip(query.slice.start-1)
			if(query.slice && query.slice.limit && query.slice.limit > 0)
				queryChain.limit(query.slice.limit)

			queryChain.exec(function(err, list) {
				if (err) {
					return next(err);
				} else {
					res.body = res.body || {};
					res.body.list = list;
					res.body.total = total;
					res.body.start = query.slice.start;
					res.body.limit = query.slice.limit;
					return next();
				}
			});
		}
	});

}
CrudMiddleware.prototype.create = function(req, res, next){
	
}

// document middleware
CrudMiddleware.prototype.read = function(req, res, next){
	res.body = req.document.toJSON();
}
CrudMiddleware.prototype.update = function(req, res, next){
	
}
CrudMiddleware.prototype.delete = function(req, res, next){
	
}

// params
CrudMiddleware.prototype.paramId = function(req, res, next, id){
	this.store.findById(id).exec(function(err, _document) {
		if(err) {
			next(err);
		} else {
			req.document = _document;
			next();
		}
	});
}