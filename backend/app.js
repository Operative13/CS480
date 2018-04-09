const express = require('express');
const app = express();

const db = require('./db');

const UserController = require('./users/UserController');
const GameController = require('./games/GameController');
const NotificationController = require('./notifications/NotificationController');

app.use('/api/users', UserController);
app.use('/api/games', GameController);
app.use('/api/notifications', NotificationController);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// app.get('/notifications', (req, res) => {
//   res.render('notifications');
// });

module.exports = {
  app,
};