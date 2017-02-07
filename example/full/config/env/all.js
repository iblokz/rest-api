'use strict';

const path = require('path');
const rootPath = path.normalize(path.join(__dirname, '../..'));

module.exports = {
	app: {
		title: 'REST API Full Example',
		description: '',
		keywords: ''
	},
	root: rootPath,
	port: process.env.PORT || 3000,
	templateEngine: 'jade',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
	languages: ['bg', 'en'],
	defaultLanguage: 'bg',
	roles: ['anon', 'admin', 'user', 'publisher'],
	userRoles: ['user', 'publisher']
};
