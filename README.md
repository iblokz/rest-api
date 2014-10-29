# iblokz / restify
RAD framework build on top of express and mongoose that 
- both parses mongoose schema and serves RESTful API from a .json file
- provides toolkit that abstract common CRUD operations (crudify) with:
 - express middleware (for example: crud.list(req, res)
 - promises interface - crud.promiseList(req, match, project, sort, populate)

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
 - view (req, res)
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
