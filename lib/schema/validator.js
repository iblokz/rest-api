"use strict"

var validators = {};

var validateMaxLength = function(value, schema, node){
	schema.path(node).validate(function(field) {
		//console.log(node, field, value);
		return field && field.length <= value;
	}, node+' must be '+value+' characters or less long', "maxLength");
}

validators["maxLength"] = validateMaxLength;


var validateMinLength = function(value, schema, node){
	schema.path(node).validate(function(field) {
		//console.log(node, field, value);
		return field && field.length > value;
	}, node+' must be more than '+value+' characters long', "minLength");
	return true
}

validators["minLength"] = validateMinLength;


var validateIsEmail = function(value, schema, node){
	schema.path(node).validate(function (field) {
		var re = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
		return re.test(field); // Assuming email has a text attribute
	}, 'Invalid email value for '+node, 'isEmail')
}

validators["isEmail"] = validateIsEmail;


var validate = function(validator, value, schema, node){
	if(typeof validators[validator] === "function"){
		return validators[validator](value, schema, node);
	}
	return false;
}

module.exports = {
	validate: validate,
	validators: Object.keys(validators)
};

