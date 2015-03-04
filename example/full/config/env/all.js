'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
	app: {
		title: 'Restify Full Example',
		description: '',
		keywords: ''
	},
	root: rootPath,
	port: process.env.PORT || 3000,
	templateEngine: 'jade',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	languages: ['bg','en'],
	defaultLanguage: 'bg',
	roles: ['anon','admin','user','publisher'],
	userRoles: ['user','publisher']
};