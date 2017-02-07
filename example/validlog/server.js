'use strict';

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const restApi = require('../../lib');
const restMap = require('./rest.json');

var app = express();

// mongoose.connect('mongodb://localhost/express_test'); // connect to our database

const db = mongoose.connect('mongodb://localhost/rest_api_validlog');

app.set('port', process.env.PORT || 3000);
// app.set('views',__dirname+'/app/views');
// app.set('view engine','jade');

app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());

// app.use(express.static(__dirname+"/public"));

// app.get("/", function(req, res){
// 	res.send("Hello World!");
// });

// init model
restApi.loadModel(restMap, db);

// set up example data
// require('./dbSetup')(db);

// set up example data
// require('./dbSetup')(db);

restApi.initRoutes(app, restMap, {}, db);

http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port: ' + app.get('port'));
});
