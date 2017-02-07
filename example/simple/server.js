'use strict';

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const restApi = require('../../lib');
const restMap = require('./rest.json');
const path = require('path');

const app = express();
const db = mongoose.connect('mongodb://localhost/rest_api_example');

app.set('port', process.env.PORT || 3000);
// app.set('views', __dirname+'/app/views');
// app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(express.static(path.join(__dirname, '/public')));

// app.get('/', function(req, res) {
// 	res.send('Hello World!');
// });

// init model
restApi.loadModel(restMap, db);

// set up example data
require('./dbSetup')(db);

// custom controller example
const customCtrls = {
	users: {
		me: (req, res) =>
			// get the first user
			db.model('User').findOne()
				.then(
					data => res.json({data}),
					error => res.json({error})
				),
		articles: (req, res) =>
			db.model('Article').find({createdBy: req.store.user._id})
				.then(
					data => res.json({data}),
					error => res.json({error})
				)
	}
};

restApi.initRoutes(app, restMap, customCtrls, db);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port: ' + app.get('port'));
});
