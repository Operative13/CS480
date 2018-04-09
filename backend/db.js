const mongoose = require('mongoose');
const { call } = require('./utility/shell');

try {
  const config = require('./config.js');
  mongoose.connect(config.mongoDbUri)
    .catch((reason) => {
      console.error(reason);
    });
} catch(error) {
  console.error(error);
  console.warn('Not using remote instance of mongodb, using localhost:27017');

  // start the mongo-server so we can do use local instance of MongoDB
  call('sudo mongod');
  mongoose.connect('mongodb://localhost/CS480')
    .catch((reason) => {
      console.error(reason);
    });
}
