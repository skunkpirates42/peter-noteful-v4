'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI, { useNewUrlParser: true, useCreateIndex : true })
      .then(() => User.deleteMany());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return User.deleteMany();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('POST /api/users', function () {

    it('Should create a new user', function () {
      let res;
      return chai
        .request(app)
        .post('/api/users')
        .send({ username, password, fullname })
        .then(_res => {
          res = _res;
          expect(res).to.have.status(201);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'username', 'fullname');
          expect(res.body.id).to.exist;
          expect(res.body.username).to.equal(username);
          expect(res.body.fullname).to.equal(fullname);
          return User.findOne({ username });
        })
        .then(user => {
          expect(user).to.exist;
          expect(user.id).to.equal(res.body.id);
          expect(user.fullname).to.equal(fullname);
          return user.validatePassword(password);
        })
        .then(isValid => {
          expect(isValid).to.be.true;
        });
    });

    it('Should reject users with missing username', function () {
      const newUser = { fullname , password };

      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Missing \'username\' in request body');
        });
    });

    it('Should reject users with missing password', function () {
      const newUser = { fullname, username };

      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Missing \'password\' in request body');
        });
    });

    it('Should reject users with non-string username', function () {
      const newUser = { username: 123, fullname , password };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Incorrect field type: expected string');
        });
    });

    it('Should reject users with non-string password', function () {
      const newUser = { username, fullname , password: {object: 123} };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Incorrect field type: expected string');
        });
    });

    it('Should reject users with non-trimmed username', function () {
      const newUser = { username: '  username  ', fullname , password };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Cannot start or end with whitespace');
        });
    });

    it('Should reject users with non-trimmed password', function () {
      const newUser = { username: '  username  ', fullname , password };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Cannot start or end with whitespace');
        });
    });

    it('Should reject users with empty username', function () {
      const newUser = { username: '', fullname , password };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Must be at least 1 characters long ');
        });
    });

    it('Should reject users with password less than 8 characters', function () {
      const newUser = { username, fullname , password: 'abc' };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Must be at least 8 characters long ');
        });
    });

    it('Should reject users with password greater than 72 characters', function () {
      const newUser = { username, fullname , password: new Array(73).fill('a').join('') };
      return chai.request(app)
        .post('/api/users')
        .send(newUser)
        .then(res => {
          expect(res).to.have.status(422);
          expect(res.body.message).to.eq('Must be at most 72 characters long ');
        });
    });

    it('Should reject users with duplicate username', function () {
      const newUser = { username, fullname , password };
      return User.create(newUser)
        .then(() => {
          return chai.request(app)
            .post('/api/users')
            .send(newUser);
        })
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.eq('The username already exists');
        });
    });
  });
});