"use strict";

/**
 * First we set the node enviornment variable if not set before
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Module dependencies.
 */
var config = require('./config/config');
var mongoose = require('mongoose');
var chalk = require('chalk');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
// Bootstrap db connection
var db = mongoose.connect(config.db.uri, config.db.options, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});


// restify
var restify = require("../../lib/restify.js");
var restMap = require("./data/rest.json");

var crudify = restify.crudify;

require('./app/models/user');
restify.loadModel(restMap, db);

var usersCrud = crudify('User',db);
var articlesCrud = crudify('Article',db);

var userDocument = {
	"name" : "John Doe",
	"email" : "test@test.com",
	"password" : "secret"
};

var articleDocument = {
	"title" : "Test Article",
	"body" : "Test Test"
}


usersCrud.promiseCreate(userDocument).then(function(userStore){

	articleDocument.createdBy = userStore._id;

	return articlesCrud.promiseCreate(articleDocument).then(function(articleStore){
		return {
			msg: 'Succesfuly imported example data',
			user: userStore,
			article: articleStore
		};
	});
}).then(function(result){
	console.log(result);
},function(errors){
	console.log(errors);
})
