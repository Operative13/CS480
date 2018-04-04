const express = require('express');
const app = express();
const db = require('./db');

const UserController = require('./user/UserController');
const MatchController = require('./match/MatchController.js');
app.use('/api/users', UserController);
app.use('/api/matches', MatchController);

module.exports = app;