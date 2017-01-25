'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const queryOp = {
	sort: (query, val) => query.sort(val),
	project: (query, val) => query.project(val),
	populate: (query, val) => query.populate(val),
	start: (query, val) => query.skip(val - 1),
	limit: (query, val) => val > 0 && query.limit(val) || query
};

module.exports = function(model, db) {
	var Store = (db) ? db.model(model) : mongoose.model(model);

	var crud = {};

	crud.promiseValidateAndSave = store => store.validate().then(() => store.save());

	/*
	crud.promiseValidateAndSave = store => new Promise((resolve, reject) => {
		store.validate(function(err) {
			if (err) {
				reject(err);
			} else {
				store.save(function(err) {
					if (err) {
						reject(err);
					} else {
						resolve(store);
					}
				});
			}
		});
	});
	*/

	crud.promiseCreate = params => (new Store(params)).save();

	crud.create = (prefs, config) => (req, res) => {
		let doc = Object.assign({}, req.body);

		if (req.user && req.user._id) doc.createdBy = req.user._id;

		if (config['hook']
			&& config['hook']['hostParam']
			&& req.params[config['hook']['hostParam']]
			&& config['hook']['linkField']
		) {
			if (prefs.schema[config['hook']['linkField']] === 'ObjectId') {
				doc[config['hook']['linkField']] = crud.parseId(
					req.params[config['hook']['hostParam']]
				);
			} else {
				doc[config['hook']['linkField']] = req.params[config['hook']['hostParam']];
			}
		}

		(new Store(doc)).save()
			.then(
				store => res.json(store),
				err => res.status(500).json(err)
			);
	};

	/**
	 * Show the current document
	 */
	crud.read = (req, res) => res.jsonp(req['store' + model]);

	crud.promiseUpdate = (params, store) =>
		(!store && params['_id'])
			? Store.findById(params['_id']).then(store =>
					(Object.assign(store, params)).save()
				)
			: (Object.assign(store, params)).save();

	/**
	 * Update a document
	 */
	crud.update = (req, res) =>
		(!req[`store${model}`] && req.body['_id'])
			? Store.findById(req.body['_id']).then(store =>
				(Object.assign(store, req.body)).save())
			: (Object.assign(req[`store${model}`], req.body)).save()
		.then(
			store => res.json(store),
			err => res.status(500).json(err)
		);

	/**
	 * Delete a document
	 */
	crud.delete = (req, res) =>
		req[`store${model}`].remove()
		.then(
			store => res.json(store),
			err => res.status(500).json(err)
		);

	crud.promiseList = (params = {}) =>
		Promise.promisify(Store.count, {context: Store})(params.match || {})
			.then(total =>
				Object.keys(params).reduce((query, op) =>
					(params[op] && queryOp[op] && queryOp[op](query, params[op]) || query),
					Store.find(params.match || {}))
				.exec()
				.then(list => ({
					total,
					start: params.start,
					limit: params.limit,
					list
				}))
			);

	// backwards compatible
	crud.qCommonFind = crud.promiseList;

	crud.list = (prefs, config) =>
		(req, res) => {
			var query = {
				match: {},
				start: 1,
				limit: 10,
				populate: config['populate'] || [],
				project: config['project'] || false
			};

			if (req.query) {
				if (req.query.createdBy) {
					query.match.createdBy = req.query.createdBy;
				}

				if (req.query.start) {
					query.start = parseInt(req.query.start, 10);
				}

				if (req.query.limit) {
					query.limit = parseInt(req.query.limit, 10);
				}

				if (prefs.searchable && req.query.search) {
					var search = req.query.search;
					var searchRegEx = new RegExp(search.toLowerCase(), 'i');

					if (req.query.searchField
						&& req.query.searchField !== ''
						&& prefs.searchable.indexOf(req.query.searchField) > -1) {
						query.match[req.query.searchField] = {$regex: searchRegEx};
					} else {
						query.match['$or'] = [];
						for (var i in prefs.searchable) {
							var queryObj = {};
							queryObj[prefs.searchable[i]] = {$regex: searchRegEx};
							query.match['$or'].push(queryObj);
						}
					}
				}

				for (var field in prefs.schema) {
					if (typeof req.query[field] !== 'undefined'
						&& typeof query.match[field] === 'undefined') {
						query.match[field] = req.query[field];
					}
				}
			}

			if (config['hook']) {
				if (config['hook']['hostParam']
					&& req.params[config['hook']['hostParam']]
					&& config['hook']['linkField']) {
					if (prefs.schema[config['hook']['linkField']] === 'ObjectId'
						|| prefs.schema[config['hook']['linkField']].type === 'ObjectId') {
						query.match[config['hook']['linkField']] = crud.parseId(
							req.params[config['hook']['hostParam']]
						);
					} else {
						query.match[config['hook']['linkField']] = req.params[
							config['hook']['hostParam']
						];
					}
				}
			}

			if (config['filters']) {
				for (var filter in config['filters']) {
					var value = config['filters'][filter];
					query.match[filter] = value;
				}
			}

			crud.promiseList(query)
				.then(
					result => res.json(result),
					error => res.status(500).json(error)
				);
		};

	// keeping for backwards compatibility
	crud.promiseStoreById = id => Store.findById(id);

	crud.getByID = function(req, res, next, id) {
		Store.findById(id).then(
			function(store) {
				// TODO add error handling middleware
				// if (!store) return next(new Error('Failed to load ' + id));
				req['store' + model] = store;
				next();
			},
			function(err) {
				return next(err);
			});
	};

	crud.parseId = function(id) {
		return mongoose.Types.ObjectId(id);
	};

	return crud;
};
