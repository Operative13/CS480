const express = require('express');
const app = express();
const db = require('./db');

const UserController = require('./user/UserController');
const GameController = require('./game/GameController.js');
app.use('/api/users', UserController);
app.use('/api/games', GameController);

module.exports = app;