var express = require('express');
var app = express();
var db = require('./db');

var UserController = require('./user/UserController');
const MatchController = require('./match/MatchController.js');
app.use('/users', UserController);
app.use('/api/match', MatchController);

module.exports = app;