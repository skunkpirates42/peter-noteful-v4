const express = require('express');

const User = require('../models/user');

const router = express.Router();


router.post('/', (req, res, next) => {
  const { fullname, username, password } = req.body;

  // Validate Users *********
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next (err);
  }

  const stringFields = ['username', 'password', 'fullname'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error('Incorrect field type: expected string');
    err.status = 422;
    return next(err);
  }

  const explicitlyTrimmedFields = ['username', 'password', 'fullname'];
  const nonTrimmedField = explicitlyTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error('Cannot start or end with whitespace');
    err.status = 422;
    return next(err);
  }

  const sizedFields = {
    username: {
      min: 1  
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
        req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
        req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    const err = new Error(
      tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long `
        : `Must be at most ${sizedFields[tooLargeField].max} characters long `
    );
    err.status = 422;
    return next(err);
  }

  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      };
      return User.create(newUser);
    })
    .then(result => {
      return res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        const dupErr = new Error('The username already exists');
        dupErr.status = 400;
        next(dupErr);
      }
      next(err);
    });
});

module.exports = router;
