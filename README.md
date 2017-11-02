# iBlokz / REST API
Generates a rest api with mongodb middleware from a json file

## Install
```sh
npm install iblokz-rest-api
```

## Basic Usage
- server.js
```js
// dependencies
const express = require('express');
const mongoose = require('mongoose');

// rest api
const restApi = require('iblokz-rest-api');
const restMap = require('./rest.json');

// create app and db instances
const app = express();
const db = mongoose.connect('mongodb://localhost/rest_api_example');

// loads the models from json schema
restApi.loadModel(restMap, db);


// initis rest endpoints
restApi.initRoutes(app, restMap, {}, db);

```

- rest.json
```json
{
	"collections": {
		"users": {
			"model": "User",
			"schema": {
				"name": "String",
				"email": { "type":"String", "isEmail":true, "unique": true},
				"password": "String"
			}
		},
		"articles": {
			"model": "Article",
			"schema": {
				"title" : { "type": "String", "required": true, "minLength": 1, "maxLength": 5, "unique": true },
				"viewCount": { "type": "Number", "min": 1},
				"body" : "String",
				"createdBy" : { "type": "ObjectId", "ref":"User", "required": false},
				"dateCreated": { "type": "Date", "default": "Date.now" }
			}
		}
	},
	"routes": {
		"api" : {
			"_meta": {
				"virtual": true,
				"crud": true,
				"contentType": "json"
			},
			"users": {},
			"articles": {}
		}
	}
}
```

## API
- **lib/index.js**
	- loadModel (map, db) // parses and loads all schemas from the restMap into mongoose models
	- initRoutes (app, map, ctrl, db) // generates the RESTful API endpoints with crud functionality
- **lib/crud/middleware.js**
- **lib/route/auth.js**
- **lib/route/builder.js**
- **lib/schema/parser.js**
- **lib/schema/validator.js**
