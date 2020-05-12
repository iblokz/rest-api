// lib
const request = require('supertest');
const status = require('http-status');
const {expect} = require('chai');

// helpers
const {initServer} = require('./helpers/server');
const {createDb, destroyDb} = require('./helpers/database');

// iblokz rest api
const api = require('../../lib/index.js');

// data
const rest = require('./rest.json');
const mockData = require('./data.json');

let mongoServer;
let db;
let app;

const populateData = (db, mockData) => {
	const User = db.model('User');
	const Article = db.model('Article');
	return User.create(mockData.users[0]).then(user =>
		Article.create(mockData.articles.map(
			article => Object.assign({}, article, {createdBy: user._id})
		)).then(articles => ({
			user,
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
					expect(res.body.total).to.equal(1),
					expect(res.body.start).to.equal(1),
					expect(res.body.limit).to.equal(10),
					expect(res.body.list).to.be.an('array'),
					expect(res.body.list.length).to.equal(1)
				))
		)
	))
));
describe('/api/articles', () => (
	describe('GET', () => (
		it('returns a list with a prepopulated articles', () =>
			request(app)
				.get('/api/articles')
				.set('accept', 'application/json')
				.expect(status.OK)
				.then(res => (
					// console.log(res.body),
					expect(res.body).to.be.an('object'),
					// expect(res.body.query).to.be.an('object'),
					expect(res.body.total).to.equal(2),
					expect(res.body.start).to.equal(1),
					expect(res.body.limit).to.equal(10),
					expect(res.body.list).to.be.an('array'),
					expect(res.body.list.length).to.equal(2)
				))
		)
	))
));
