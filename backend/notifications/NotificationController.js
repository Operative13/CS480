const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const { app } = require('../server');
const redis = require('redis');
const publisherClient = redis.createClient();

router.get('/', function(req, res) {
  // let request last as long as possible
  // req.socket.setTimeout(Infinity);

  let subscriber = redis.createClient();

  subscriber.subscribe("notifications");

  // In case we encounter an error...print it out to the console
  subscriber.on("error", function(err) {
    console.log("Redis Error: " + err);
  });

  // When we receive a message from the redis connection
  subscriber.on("message", function(channel, message) {

    res.write("data: " + message + '\n\n'); // Note the extra newline
  });

  //send headers for event-stream connection
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');

  // The 'close' event is fired when a user closes their browser window.
  // In that situation we want to make sure our redis channel subscription
  // is properly shut down to prevent memory leaks...and incorrect subscriber
  // counts to the channel.
  req.on("close", function() {
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

router.get('/user/:id', (req, res) => {

});

// send message with data = 'hi' every 3 seconds
// setInterval(
//   () => {
//     publisherClient.publish('notifications', 'hi');
//   },
//   3000
// );

module.exports = router;