'use strict';

const expect = require('chai').expect;
// const mongoose = require('mongoose');

const parser = require('../../../lib/schema/parser');

describe('schema/parser', () => (
  describe('parseType', () => (
    it('parses string type to mongoose type', () =>
      expect(parser.parseType('string')).to.equal(String)
		),
    it('parses string type in array to mongoose type in array', () =>
      expect(parser.parseType(['date'])).to.deep.equal([Date])
		)
	)),
	describe('parseField', () => (
    it('parses field of type date with default value Date.now', () =>
			expect(parser.parseField({
				type: 'date',
				default: 'Date.now'
			})).to.deep.include({
				type: Date,
				default: Date.now
			})
		),
		it('parses field of type string with match regexp', () =>
			expect(parser.parseField({
				type: 'string',
				match: '^[a-z0-9]+$'
			}).match.toString()).to.equal('/^[a-z0-9]+$/')
		)
	))
));
