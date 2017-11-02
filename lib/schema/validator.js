'use strict';

let validators = {
	// maxLength: value => field => field && field.length <= value,
	// minLength: value => field => field && field.length > value,
	isEmail: value => field => /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(field),
	isPhone: value => field => /^(\+|0|00)(?:[0-9] ?){6,14}[0-9]$/.test(field)
};

let msgs = {
	// maxLength: (field, value) => `${field} must be ${value} characters or less long'`,
	// minLength: (field, value) => `${field} must be more than ${value} characters long'`,
	isEmail: (field, value) => `Invalid email value for ${field}`,
	isPhone: (field, value) => `Invalid phone value for ${field}`
};

const validate = (validator, value, schema, field) =>
	(typeof validators[validator] === 'function')
		? schema.path(field).validate(
			validators[validator](value),
			msgs[validator](field, value),
			validator)
		: false;

module.exports = {
	validate: validate,
	validators: Object.keys(validators)
};
