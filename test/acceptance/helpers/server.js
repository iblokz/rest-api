'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

const initServer = () => {
	const app = express();
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.json());
	app.use(methodOverride());
	return app;
};

module.exports = {
	initServer
};
