const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const { app } = require('../server');
const redis = require('redis');
const publisherClient = redis.createClient();

const { handlePublishing } = require('./NotificationFunctions');

const publisherNames = {
  allUsers: () => 'notifications',
  user: (userId) => `notifications/${userId}`,
};

router.get('/', function(req, res) {
  handlePublishing('notifications', req, res);
});

router.get('/user/:id', function(req, res) {
  handlePublishing(publisherNames.user('5acf0998cb70ea32d727b371'), req, res);
});

// send message with data = 'hi' every 3 seconds
setInterval(
  () => {
    publisherClient.publish(publisherNames.user('5acf0998cb70ea32d727b371'), 'hi');
    publisherClient.publish(publisherNames.allUsers(), 'hi');
  },
  3000
);

module.exports = { router, publisherNames, publisherClient };