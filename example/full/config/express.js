'use strict';

const path = require('path');
const fileUtil = require('../util/file');
const passport = require('passport');

const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
// restApi
const restApi = require("../../../lib");
const restMap = require("../data/rest.json");

module.exports = function(db) {
	// declare our app
	const app = express();

	// Initialize models
	fileUtil.walk('./app/models', /(.*)\.(js$|coffee$)/).forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});

	// init additional models
	restApi.loadModel(restMap, db);

	// config stuff

	app.set('views', path.join(__dirname, '../app/views'));
	app.set('view engine', 'jade');

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
		store: new MongoStore({
			mongooseConnection: db.connection,
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

	app.use(express.static(path.join(__dirname, '../public')));

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
	restApi.initRoutes(app, restMap, {}, db);

	return app;
};
