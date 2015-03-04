'use strict'
var path = require('path');
var http = require('http');
var fileUtil = require('../util/file');
var passport = require('passport');

var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')({
	session: session
});
var flash = require('connect-flash');
var config = require('./config');

// restify
var restify = require("../../../lib/restify.js");
var restMap = require("../data/rest.json");


module.exports = function(db){
	// declare our app
	var app = express();

	// Initialize models
	fileUtil.walk('./app/models', /(.*)\.(js$|coffee$)/).forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});

	// init additional model from restify
	restify.loadModel(restMap, db);

	// config stuff

	app.set('views',__dirname+'/../app/views');
	app.set('view engine','jade');

	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());
	app.use(methodOverride());

	app.use(cookieParser('tumba lumba ping pong'));
	app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: 'tumba lumba ping pong',
		store: new mongoStore({
			db: db.connection.db,
			collection: 'sessions'
		}),
		cookie: {
			path: '/',
			httpOnly: true,
			secure: false,
			maxAge: 3600000
		},
		name: 'connect.sid'
	}));
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(flash());

	app.use(express.static(__dirname+"/../public"));

	/*
	fileUtil.walk('./app/middleware', /(.*)\.(js$|coffee$)/).forEach(function(middlewarePath) {
		require(path.resolve(middlewarePath))(app);
	});
*/

	// Load Routes
	fileUtil.walk('./app/routes', /(.*)\.(js$|coffee$)/).forEach(function(routePath) {
		require(path.resolve(routePath))(app);
	});

	// TODO: load additional routes
	restify.initRoutes(app,restMap,{},db);

	return app;
}