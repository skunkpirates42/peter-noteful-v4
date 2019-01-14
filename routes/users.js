const express = require('express');

const User = require('../models/user');

const router = express.Router();


router.post('/', (req, res, next) => {
  const { fullname, username, password } = req.body;

  const newUser = { fullname, username, password };

  User.create(newUser)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        const err = new Error('Username already exists');
        err.status = 400;
      }
      next(err);
    });
});

module.exports = router;

