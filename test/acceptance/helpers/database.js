
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const {MongoMemoryServer} = require('mongodb-memory-server');
// const uuidv1 = require('uuid/v1');

const opts = {useMongoClient: true};

const createDb = () => {
	const mongoServer = new MongoMemoryServer();
	return mongoServer.getUri()
		.then(mongoUri => {
			const db = mongoose.connect(mongoUri, opts);
			return {
				db, mongoServer
			};
		});
};

const destroyDb = ({db, mongoServer}) =>
	db.disconnect()
		.then(() => mongoServer.stop());

module.exports = {
	createDb,
	destroyDb
};
