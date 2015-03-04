'use strict'

var mongoose = require('mongoose');
var crypto   = require('crypto');




// define the schema for our user model
// role - admin, user
var userSchema = mongoose.Schema({
	name : String,
	role : { type: String, default: 'user' },
	email : String,
	password : String,
	salt : String,
	registerDate : { type: Date, default: Date.now },
	lastLoginDate : Date
});


/**
 * Hook a pre save method to hash the password
 */
userSchema.pre('save', function(next) {
	if (!this.salt && this.password && this.password.length > 6) {
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		this.password = this.hashPassword(this.password);
	}
	next();
});

/**
 * Create instance method for hashing a password
 */
userSchema.methods.hashPassword = function(password) {
	if (this.salt && password) {
		return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
userSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);