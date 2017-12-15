'use strict';

const mongoose = require('mongoose');
const {obj} = require('iblokz-data');

const treeReduce = (node, reducer = (n, k, v) => obj.patch(n, k, v), path = []) => Object.keys(node)
	.reduce((n2, key, index) => reducer(n2, key,
		(typeof node[key] === 'object' && node[key].constructor === Object)
			? treeReduce(node[key], reducer, [].concat(path, key))
			: node[key],
		path,
		index
	), {});

const treeFilter = (root, filter) =>
	treeReduce(root, (n, k, v, p, i) =>
		filter(n, k, v, p, i) ? obj.patch(n, k, v) : n
	);

const queryOp = {
	sort: (query, val) => query.sort(val),
	project: (query, val) => query.project(val),
	populate: (query, val) => query.populate(val),
	start: (query, val) => query.skip(val - 1),
	limit: (query, val) => val > 0 && query.limit(val) || query
};

const parseHook = (doc, req, prefs, meta) =>
	(obj.sub(meta, ['hook', 'hostParam']) && req.params[meta['hook']['hostParam']] && meta['hook']['linkField'])
		? obj.patch(doc, meta['hook']['linkField'],
			(prefs.schema[meta['hook']['linkField']] === 'ObjectId')
				? mongoose.Types.ObjectId(req.params[meta['hook']['hostParam']])
				: req.params[meta['hook']['hostParam']]
			)
		: doc;

const prepareSearch = (req, prefs, meta) => {
	let match = {};
	var search = req.query.search;
	var searchRegEx = new RegExp(search.toLowerCase(), 'i');

	if (req.query.searchField
		&& req.query.searchField !== ''
		&& prefs.searchable.indexOf(req.query.searchField) > -1) {
		match[req.query.searchField] = {$regex: searchRegEx};
	} else {
		match['$or'] = [];
		for (var i in prefs.searchable) {
			var queryObj = {};
			queryObj[prefs.searchable[i]] = {$regex: searchRegEx};
			match['$or'].push(queryObj);
		}
	}
	return match;
};

const prepareMatch = (req, prefs, meta) =>
	parseHook(Object.assign({},
		// access
		req.access ? {$or: [].concat(
			req.access.createdBy ? {createdBy: req.access.createdBy} : [],
			req.access.assignedTo ? req.access.assigned.map(assigned =>
				obj.keyValue(assigned, {
					$elemMatch: {
						_id: req.access.assignedTo
					}
				})
			) : []
		)} : {},
		// created by
		// req.query.createdBy ? {createdBy: req.query.createdBy} : {},
		// search
		(prefs.searchable && req.query.search) ? prepareSearch(req, prefs, meta) : {},
		// query filters
		prefs.schema ? Object.keys(prefs.schema).reduce((o, field) =>
			req.query[field] && !(req.query.searchField === field)
				? obj.patch(o, field, req.query[field])
				: o,
		{}) : {},
		// meta filters
		meta.filters ? Object.keys(meta.filters).reduce((o, field) =>
			obj.patch(o, field, meta.filters[field]),
		{}) : {}
	), req, prefs, meta);

const prepareDoc = (doc, pref, meta) => (meta.excludeFields && meta.excludeFields.length > 0)
	// ? treeReduce(doc._doc)
	?	treeFilter(doc,
		(node, key, value, path) => meta.excludeFields.indexOf(
			[].concat(path, key).join('.')
		) === -1
	)
	: doc;

// collection
const list = Store => (prefs, meta) =>
	(req, res) =>
		[{
			match: prepareMatch(req, prefs, meta),
			start: req.query.start && Number(req.query.start) || 1,
			limit: req.query.limit && Number(req.query.limit) || 10,
			populate: meta['populate'] || [],
			project: meta['project'] || false
		}]
		.map(params => (console.log(req.access, params.match['$or']), params))
		.map(params =>
			Store.count(params.match || {}).exec()
				.then(total =>
					// query chain
					Object.keys(params).reduce((query, op) =>
						(params[op] && queryOp[op] && queryOp[op](query, params[op]) || query),
						Store.find(params.match || {}))
						.exec()
						.then(list => ({
							total,
							start: params.start,
							limit: params.limit,
							list: list.map(doc => prepareDoc(doc._doc, prefs, meta))
						}))
				)
			)
		.pop().then(
			result => res.json(result),
			error => (console.log(error), res.status(500).json(error))
		);

const create = Store => (prefs, meta) =>
	(req, res) =>
		Store.create(
			parseHook(Object.assign({},
				req.body,
				(req.user && req.user._id) ? {createdBy: req.user._id} : {}
			), req, prefs, meta)
		)
			.then(
				store => res.json(store),
				err => res.status(500).json(err)
			);

// document
const read = Store => (prefs, meta) =>
	(req, res) => res.json(prepareDoc(
		req.store[Store.modelName.toLowerCase()]
	));

const update = Store => (prefs, meta) =>
	(req, res) =>
		(!req.store[Store.modelName.toLowerCase()] && req.body['_id'])
			? Store.findById(req.body['_id']).then(store =>
				(Object.assign(store, req.body)).save())
			: (Object.assign(req.store[Store.modelName.toLowerCase()], req.body)).save()
		.then(
			store => res.json(store),
			err => res.status(500).json(err)
		);

const _delete = Store => (prefs, meta) =>
	(req, res) =>
		req.store[Store.modelName.toLowerCase()]
		.remove()
		.then(
			store => res.json(store),
			err => res.status(500).json(err)
		);

const idParam = Store => (prefs, meta) =>
	(req, res, next, id) =>
		Store.findById(id).then(
			store => {
				req.store = req.store || {};
				req.store[Store.modelName.toLowerCase()] = store;
				next();
			},
			err => next(err)
		);

const init = (model, db = mongoose) => ({
	list: list(db.model(model)),
	create: create(db.model(model)),
	read: read(db.model(model)),
	update: update(db.model(model)),
	delete: _delete(db.model(model)),
	idParam: idParam(db.model(model))
});

module.exports = {
	queryOp,
	parseHook,
	prepareSearch,
	prepareMatch,
	prepareDoc,
	init,
	list,
	create,
	read,
	update,
	delete: _delete,
	idParam
};
