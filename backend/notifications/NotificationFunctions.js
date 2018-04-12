const redis = require('redis');

function handlePublishing(publisherName, req, res) {
  if (req.accepts('text/event-stream')) {
    let subscriber = redis.createClient();

    subscriber.subscribe(publisherName);

    // send headers for event-stream connection
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // In case we encounter an error...print it out to the console
    subscriber.on("error", function(err) {
      console.error("Redis Error: " + err);
    });

    // When we receive a message from the redis connection
    subscriber.on("message", function(channel, message) {
      // res.json({data: message});
      console.log(channel, message);
      res.write(message);
    });

    // The 'close' event is fired when a user closes their browser window.
    // In that situation we want to make sure our redis channel subscription
    // is properly shut down to prevent memory leaks.
    req.on("close", function() {
      subscriber.unsubscribe();
      subscriber.quit();
    })
  } else {
    console.warn('text/event-stream is not accepted by requester');
  }
}

module.exports = {
  handlePublishing,
};