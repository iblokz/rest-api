'use strict';

const uuidv1 = require('uuid/v1');
const faker = require('faker');

const user = overrides => ({
	_id: uuidv1(),
	fullName: faker.name.findName(),
	email: faker.internet.email(),
	password: faker.internet.password(),
	...overrides
});

const users = mold => (mold instanceof Array ? mold : Array(mold).fill({})).map(user);

const article = overrides => [overrides.title || faker.lorem.sentence()].map(title => ({
	_id: uuidv1(),
	title,
	slug: faker.helpers.slugify(title),
	text: faker.lorem.paragraph(),
	...overrides
})).pop();

const articles = mold => (mold instanceof Array ? mold : Array(mold).fill({})).map(article);

module.exports = {
	user,
	users,
	article,
	articles
};
