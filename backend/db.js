var mongoose = require('mongoose');
var config = require('./config.js');
mongoose.connect(config.mongoDbUri).catch((reason) => console.log(reason));