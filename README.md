# iblokz / restify
a nodejs RAD framework build on top of express and mongoose that 
- uses a json map to
 - parse mongoos schema
 - serve RESTful API
- provides toolkit that abstract common CRUD operations with:
 - express middleware
 - promises interface

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
- express middleware
 - list (req, res)
 - read (req, res)
 - create (req, res)
 - update (req, res)
 - delete (req, res)
 - getByID (req, res, next, id)
- promises interface
 - promiseList
 - promiseCreate
 - promiseStoreById
- helper functions
 - parseId (id) // parses a string into a mongoose ObjectId 
