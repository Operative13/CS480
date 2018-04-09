const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const { errorToJson } = require('../exceptions/exceptions');

const { app, http, io } = require('../server');
console.log(io);

router.get('/', (req, res) => {
  res.send('ok');
});

// io.sockets.on('connection', (socket) => {
//   console.log('users connected');
// });

io.on('connection', (socket) => {
  console.log('users connected');
});
// const redis = require('redis');
// const publisherClient = redis.createClient();

// router.get('/', (req, res) => {
//   let subscriber = redis.createClient();
//
//
// });

module.exports = router;