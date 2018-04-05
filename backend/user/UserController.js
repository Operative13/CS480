const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const User = new require('./User');

/**
 * @returns all users from db.users
 */
router.get('/', function (req, res) {
  User.find({}, function (err, users) {
    if (err) return res.status(500).send("There was a problem finding the users.");
    res.status(200).send(users);
  });
});

/**
 * Create user in db.users
 * Request body should contain:
 * username, password
 * Optional in request body:
 * email
 */
router.post('/', function (req, res) {
  console.log(req.body.password);
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send(err.message);

    User.create({
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword,
      },
      function (err, user) {
        if (err) return res.status(500).send(err.message);
        res.status(200).send(user);
      }
    );
  });
});

/**
 * @returns a specific user queried by their _id field from db.users
 */
router.get('/:id', function (req, res) {
  User.findById(req.params.id, function (err, user) {
    if (err) return res.status(500).send("There was a problem finding the user.");
    if (!user) return res.status(404).send("No user found.");
    res.status(200).send(user);
  });
});

/**
 * deletes a specific user queried by their _id field from db.users
 */
router.delete('/:id', function (req, res) {
  User.findByIdAndRemove(req.params.id, function (err, user) {
    if (err) return res.status(500).send("There was a problem deleting the user.");
    res.status(200).send("User: "+ user.name +" was deleted.");
  });
});

/**
 * updates a user
 * @returns a specific user queried by their _id field from db.users
 */
router.put('/:id', function (req, res) {
  User.findByIdAndUpdate(req.params.id, req.body, {new: true}, function (err, user) {
    if (err) return res.status(500).send("There was a problem updating the user.");
    res.status(200).send(user);
  });
});


module.exports = router;