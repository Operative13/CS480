const mongoose = require('mongoose');
const config = require('./config.js');
mongoose.connect(config.mongoDbUri).catch((reason) => console.log(reason));