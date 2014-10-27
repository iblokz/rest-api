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
var db = mongoose.connect('mongodb://localhost/express_test');


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

var users = {};

/*
users.list = function(req, res){
	res.render("users", {title: "list users"});
}

users.view = function(req, res){
	res.render("users", {title: "show user: "+req.params.id});
}
*/



restify.apply(app,restMap,{},db);


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