'use strict';

const status = require('http-status');

module.exports = method => (req, res) => {
	let response = {};

	response = Object.assign(response, res.body || {});

	return res.status(status.OK).json(response);
};
