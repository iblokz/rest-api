"use strict"

var express = require("express"),
	http = require("http"),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	methodOverride = require('method-override'),
	restify = require("../lib/restify.js"),
	restMap = require('./rest.json');


var app = express();


//mongoose.connect('mongodb://localhost/express_test'); // connect to our database

var db = mongoose.connect('mongodb://localhost/restify_example');

app.set('port',process.env.PORT || 3000);
//app.set('views',__dirname+'/app/views');
//app.set('view engine','jade');

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(express.static(__dirname+"/public"));

app.get("/", function(req,res){
	res.send("Hello World!");
});




// init model
restify.loadModel(restMap, db);

// custom controller example
var customCtrls = {
	users: {}
};

// load the crudify as a service
var usersCrud = restify.crudify('User',db);
var articlesCrud = restify.crudify('Article',db);

// set up example data
require('./dbSetup')(db);

customCtrls.users.me = function(req, res){

	// get the first user
	usersCrud.promiseList().then(function(usersList){
		// get the id of the first user
		usersCrud.promiseStoreById(usersList.list[0]._id).then(
			function(store){
				res.jsonp(store);
			},function(err){
				res.jsonp({error: err});
			});
	}, function(err){
		res.jsonp({error: err});
	});

	
}

customCtrls.users.articles = function(req, res){

	var userStore = req.store;

	articlesCrud.promiseList({ createdBy: userStore._id }).then(
		function(list){
			res.jsonp(list);
		},function(err){
			res.jsonp({error: err});
		});
}



restify.initRoutes(app,restMap,customCtrls,db);


/*
app.get(/\/users\/?(\d*)?\/?/, function(req, res){

	var title = "";

	// todo handle different response types: html, json

	// get ...
	if(req.params && req.params[0]){
		// single user
		title = 'Get single user';
	} else {
		// users
		title = 'Get users';

	}

	res.render("users", {title: title});
});
*/


// app.get("/:collection/:controller:id/:controller")


http.createServer(app).listen(app.get('port'),function(){
	console.log("Express server listening on port: " + app.get('port'));
});