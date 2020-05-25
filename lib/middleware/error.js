'use strict';

const chalk = require('chalk');
const path = require('path');
// ref: https://github.com/wdavidw/node-http-status/blob/master/src/index.litcoffee
const status = require('http-status');

// util
const Table = require('cli-table');

const defaultTableConfig = {
	chars: {
		'top': '', 'top-mid': '', 'top-left': '', 'top-right': '',
		'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': '',
		'left': '', 'left-mid': '', 'mid': '', 'mid-mid': '',
		'right': '', 'right-mid': '', 'middle': ''},
	style: {'padding-left': 0, 'padding-right': 1}
};

const table = (data, config) => {
	const tbl = new Table(
		config || defaultTableConfig
	);
	data.forEach(row => tbl.push(row));
	return tbl.toString();
};

module.exports = (err, req, res, next) => {
	// console.log(err, process.env.NODE_ENV);
	switch (err.name) {
		default:
			break;
		case 'ValidationError':
			err.status = status.BAD_REQUEST;
			break;
	}
	err.status = err.status || status.INTERNAL_SERVER_ERROR;
	// console.log(path.parse(process.mainModule.filename).dir);
	const message = err.message;
	switch (process.env.NODE_ENV) {
		default:
			break;
		case 'test':
		case 'development': {
			const stack = err.stack.replace(`${err.name}: ${err.message}\n`, '')
				.split('\n')
				.map(l => l.trim())
				.map(l => l.match(new RegExp(
					'^at\\ ' +
					'((new\\ )?[a-zA-Z0-9\\.\\_\\>\\<]+)?' + // method name
					'\\ ?\\(?' +
					'([a-zA-Z0-9\\.\\-\\_\\/]+):([0-9]+)\\:([0-9]+)' + // filename, line, column
					'\\)?$', 'i'))
				)
				.filter(l => l)
				.map(l => [
					'↓',
					l[3].replace(
						path.resolve(path.parse(process.mainModule.filename).dir, '../')
					, '') || '',
					l[4] || '',
					l[5] || '',
					l[1] || ''
				])
				.slice(0, 4)
				.reverse();
			console.log(chalk.gray(table(stack)));
			/*
			const stack = err.stack.replace(`${err.name}: ${err.message}
`, '').split('\n')
				.map(l => l.trim()
					.match(new RegExp(
						'^at\\ ' +
						'([a-zA-Z0-9\\.\\_\\>\\<]+)?' + // method name
						'\\ ?\\(?' +
						'([a-zA-Z0-9\\.\\-\\_\\/]+):([0-9]+)\\:([0-9]+)' + // filename, line, column
						'\\)?$', 'i'))
					.slice(1, 5))
				.map(l => [
					'↓',
					l[1],
					l[2], l[3],
					l[0] || ''
				])
				.slice(0, 4)
				.reverse();
			console.log(chalk.gray(stack));
			*/
			break;
		}
	}
	console.log(chalk.red('→', err.status, err.name + ':', err.message), '\n');
	res.status(err.status || status.INTERNAL_SERVER_ERROR).send({
		type: err.name || 'Error',
		message
	});
};
