# iblokz / restify
a nodejs RAD framework build on top of express and mongoose that
- uses a json map to
 - serve RESTful API
 - parse mongoose schema
- provides toolkit that abstract common CRUD operations with:
 - express middleware
 - promises interface (depricated)

## Usage
for a complete example look into the example/ dir
### rest.json
```json
  {
  	"users": {
  		"model": "User",
  		"collectionCtrls": {
  			"get": ["me"]
  		},
  		"documentCtrls": {
  			"get": ["articles"]
  		},
  		"schema": {
  			"name": "String",
  		    "email": "String",
  		    "password": "String",
  		    "date_created": { "type": "Date", "default": "Date.now" }
  		}
  	},
  	"articles": {
  		"model": "Article",
  		"schema": {
  			"title" : "String",
  			"body" : "String",
  			"createdBy" : { "type": "ObjectId", "ref":"User", "required": false}
  		}
  	}
  }
```

## API

### lib/restify.js
- loadModel (map, db) // parses and loads all schemas from the restMap into mongoose models
- initRoutes (app, map, ctrl, db) // generates the RESTful API endpoints with crud functionality


### lib/crudify.js
- moved middleware functionality to lib/crud/middleware.js
- promise logic depricated -> use mongoose api instead
