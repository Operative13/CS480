const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const ObjectId = require('mongoose').Types.ObjectId;

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const User = new require('./User');
const {
  requestError,
  serverError,
  success,
} = require('../utility/ResponseHandler');

/**
 * @returns all users from db.users
 */
router.get('/', function (req, res) {
  User.find({}, function (err, users) {
    if (err) return requestError(res, err);
    success(res, users);
  });
});

/**
 * Create users in db.users
 * Request body should contain:
 * username, password
 * Optional in request body:
 * email
 */
router.post('/register', function (req, res) {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) return serverError(res, err);
    let newUser = {
      username: req.body.username,
      password: hashedPassword,
    };
    if (req.body.email) newUser['email'] = req.body.email;

    User.create(
      newUser,
      function (err, user) {
        if (err) return requestError(res, err);
        success(res, user);
      }
    );
  });
});

/**
 * Returns status code 200 and User document if it successfully verifies
 * username and password
 * Request body should contain:
 * {
 *  username: String,
 *  password: String,
 * }
 */
router.post('/login', function(req, res) {
  if (!req.body.username) {
    return requestError(res, new Error('no username given'));
  }

  User.findOne({username: req.body.username}, (err, user) => {
    if (err) return requestError(res, err);
    if (!user) {
      let msg = `could not find user, ${req.body.username}`;
      return requestError(res, new Error(msg));
    }

    bcrypt.compare(req.body.password, user.password, (err, matched) => {
      if (err) return serverError(res, err);
      if (matched) {
        return success(res, user);
      }
      requestError(res, new Error('incorrect password'));
    });
  });
});

/**
 * @returns a specific users queried by their _id field from db.users
 */
router.get('/:id', function (req, res) {
  if (!req.params.id) {
    return requestError(res, new Error('no id given in url route'));
  }

  User.findOne({_id: ObjectId(req.params.id)}, function (err, user) {
    if (err) return requestError(res, err);
    if (!user) {
      let msg = `could not find user with _id = ${req.params.id}`;
      return requestError(res, new Error(msg));
    }

    success(res, user);
  });
});

module.exports = router;