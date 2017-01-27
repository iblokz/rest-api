'use strict';

let validators = {
	maxLength: value => field => field && field.length <= value,
	minLength: value => field => field && field.length > value,
	isEmail: value => field => /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(field)
};

let msgs = {
	maxLength: (node, value) => `${node} must be ${value} characters or less long'`,
	minLength: (node, value) => `${node} must be more than ${value} characters long'`,
	isEmail: (node, value) => `Invalid email value for ${node}`
};

const validate = (validator, value, schema, node) =>
	(typeof validators[validator] === 'function')
		? schema.path(node).validate(
			validators[validator](value),
			msgs[validator](node, value),
			validator)
		: false;

module.exports = {
	validate: validate,
	validators: Object.keys(validators)
};
