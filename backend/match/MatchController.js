var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
var Match = require('./Match');

router.get('/', function(req, res) {
  Match.find({}, function(err, matches) {
    res.status(200).send(matches);
  })
});