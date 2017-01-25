'use strict';

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const restify = require('../../lib/restify.js');
const restMap = require('./rest.json');
const path = require('path');

var app = express();

// mongoose.connect('mongodb://localhost/express_test'); // connect to our database

var db = mongoose.connect('mongodb://localhost/restify_example');

app.set('port', process.env.PORT || 3000);
// app.set('views', __dirname+'/app/views');
// app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res) {
	res.send('Hello World!');
});

// init model
restify.loadModel(restMap, db);

// custom controller example
var customCtrls = {
	users: {}
};

// load the crudify as a service
var usersCrud = restify.crudify('User', db);
var articlesCrud = restify.crudify('Article', db);

// set up example data
require('./dbSetup')(db);

customCtrls.users.me = (req, res) =>
	// get the first user
	usersCrud.promiseList()
		// get the id of the first user
		.then(usersList => usersCrud.promiseStoreById(usersList.list[0]._id))
		.then(
			data => res.json({data}),
			error => res.json({error})
		);

customCtrls.users.articles = (req, res) =>
	articlesCrud.promiseList({createdBy: req.storeUser._id})
	.then(
		data => res.json({data}),
		error => res.json({error})
	);

restify.initRoutes(app, restMap, customCtrls, db);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port: ' + app.get('port'));
});
