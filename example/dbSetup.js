"use strict"

	var crudify = require("../lib/crudify.js");

	module.exports = function(db){

		var usersCrud = crudify('User',db);
		var articlesCrud = crudify('Article',db);

		var userDocument = {
			"name" : "John Doe",
		    "email" : "test@test.com",
		    "password" : "secret"
		};

		var articleDocument = {
			"title" : "Test Article",
    		"body" : "Test Test"
		}

		usersCrud.promiseList().then(function(usersList){
			// if users empty create test data
			if(usersList.total == 0){
				usersCrud.promiseCreate(userDocument).then(function(userStore){

					articleDocument.createdBy = userStore._id;

					return articlesCrud.promiseCreate(articleDocument).then(function(articleStore){
						return {
							msg: 'Succesfuly imported example data',
							user: userStore,
							article: articleStore
						};
					});
				}).then(function(result){
					console.log(result);
				},function(errors){
					console.log(errors);
				})
			}
		});

	}	
