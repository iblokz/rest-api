'use strict';

const crudify = require('../lib/crudify');
const mongoose = require('mongoose');
const {Schema} = mongoose;
const {ObjectId} = Schema.Types;

const dbName = `test-db-${Date.now()}`;
const db = mongoose.createConnection(`mongodb://localhost:27017/${dbName}`);

db.model('User', new Schema({
	name: String, email: String, password: String,
	dateCreated: {type: Date, default: Date.now}}));

db.model('Article', new Schema({
	title: String, body: String,
	createdBy: {type: ObjectId, ref: 'User', required: false}}));

const mock = {
	user: {
		name: 'John Doe',
		email: 'test@test.com',
		password: 'secret'
	},
	article: {
		title: 'Test Article',
		body: 'Lorem Ipsum'
	}
};

var usersCrud = crudify('User', db);
var articlesCrud = crudify('Article', db);

console.log(dbName, mock);

const done = usersCrud.promiseCreate(mock.user)
	.then(userStore =>
		articlesCrud.promiseCreate(Object.assign({}, mock.article, {createdBy: userStore._id}))
			.then(articleStore => ({
				msg: 'Succesfuly imported example data',
				user: userStore,
				article: articleStore
			})))
	.then(
		res => console.log(res),
		err => console.log(err)
	);

// done.then(() => db.connection.db.dropDatabase());
