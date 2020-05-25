// lib
const request = require('supertest');
const status = require('http-status');
const {expect} = require('chai');

// helpers
const {initServer} = require('./helpers/server');
const {createDb, destroyDb} = require('./helpers/database');
const mock = require('./helpers/mock');

// iblokz rest api
const api = require('../../lib/index.js');

// data
const rest = require('./rest.json');
const mockData = {};
mockData.users = mock.users(3);
mockData.articles = mock.articles([].concat(
	...mockData.users.map(({_id}) => Array(4).fill({createdBy: _id}))
));
// console.log(mockData);

let mongoServer;
let db;
let app;

const populateData = (db, mockData) => {
	const User = db.model('User');
	const Article = db.model('Article');
	return User.insertMany(mockData.users).then(users =>
		Article.insertMany(mockData.articles).then(articles => ({
			users,
			articles
		}))
	);
};

before(() => {
	app = initServer();
	return createDb().then(res => {
		// console.log('db created', res);
		db = res.db;
		mongoServer = res.mongoServer;
	});
});

after(() => destroyDb({db, mongoServer}));

it('loads the model from the rest config', () => {
	api.loadModel(rest, db);
	expect(db.model('User').modelName).to.equal('User');
	expect(db.model('Article').modelName).to.equal('Article');
	// expect(User).to.be.an('object');
	// expect(User.modelName).to.equal('User');
	// console.log(db.model('User'));
});

it('populates the mock data', () => populateData(db, mockData)
	// .then(({user, articles}) => console.log(user, articles))
);

it('inits the routes', () => {
	api.initRoutes(app, rest, {}, db);
	return true;
});

describe('/api/users', () => (
	describe('GET', () => (
		it('returns a list with a prepopulated users', () =>
			request(app)
				.get('/api/users')
				.set('accept', 'application/json')
				.expect(status.OK)
				.then(res => (
					// console.log(res.body),
					expect(res.body).to.be.an('object'),
					// expect(res.body.query).to.be.an('object'),
					expect(res.body.total).to.equal(mockData.users.length),
					expect(res.body.start).to.equal(0),
					expect(res.body.limit).to.equal(10),
					expect(res.body.list).to.be.an('array'),
					expect(res.body.list.length).to.equal(mockData.users.length),
					res.body.list.forEach(
						(item, index) => expect(item).to.deep.include(mockData.users[index])
					)
				))
		)
	))
));
describe('/api/articles', () => (
	describe('GET', () => (
		it('returns a list with within a specific range of articles', () =>
			request(app)
				.get('/api/articles')
				.query({start: 2, limit: 3})
				.set('accept', 'application/json')
				.expect(status.OK)
				.then(res => (
					// console.log(res.body),
					expect(res.body).to.be.an('object'),
					// expect(res.body.query).to.be.an('object'),
					expect(res.body.total).to.equal(mockData.articles.length),
					expect(res.body.start).to.equal(2),
					expect(res.body.limit).to.equal(3),
					expect(res.body.list).to.be.an('array'),
					expect(res.body.list.length).to.equal(3),
					res.body.list.forEach(
						(item, index) => expect(item).to.deep.include(mockData.articles.slice(2 + index).shift())
					)
				))
		)
	))
));
