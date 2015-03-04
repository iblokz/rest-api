'use strict'
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var config = require('../../config/config');
var mongoose = require('mongoose');

module.exports = function(app) {

	app.get('/', function(req, res){

		res.render('index');
		
	});
	
	app.get('/partials/*', function(req, res){
		var filePath = req.params[0];
		var jadePath = filePath.replace('html','jade');
		fs.exists(config.root + '/app/views/partials/' + jadePath, function (exists) {
			if(exists){
				res.render('partials/'+jadePath);
			} else {
				// fallback to the current public views directory
				fs.exists(config.root + '/public/partials/' + filePath, function (exists) {
					if(exists){
						res.render('../../public/partials/'+filePath);
					}
				});
			}
		});
	});
}