const mongoose = require('mongoose');

/**
 * Attempts to connect through one of the following:
 * 1. connect via mongoDbUri if provided
 * 2. connection the the URI if config.js is provided
 * 3. if config.js is not provided, connect via localhost
 * @param mongoDbUri
 */
function connectToDb(mongoDbUri) {
  function connect(mongoDbUri) {
    // start the mongo-server so we can do use local instance of MongoDB
    // Note: you need to have mongodb-server running on the host PC for this
    // $ sudo mongod
    mongoose.connect(mongoDbUri || 'mongodb://localhost/CS480')
      .catch((reason) => {
        console.error(reason);
      });
  }

  if (!mongoDbUri) {
    try {
      const config = require('./config.js');
      connect(config.mongoDbUri);
    } catch (error) {
      console.error(error);
      console.warn(`Failed to load MongoDB URI from config.js, attempting to\
        connect via ${mongoDbUri} or localhost:27017`);
      connect(mongoDbUri || 'mongodb://localhost/CS480');
    }
  }
  else {
    connect(mongoDbUri);
  }
}

module.exports = { connectToDb };