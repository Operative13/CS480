const express = require('express');
const app = express();
var http = require('http').Server(app);
var db = require('./db');
var io = require('socket.io')(http);

// io.onconnection('connection', (socket) => {
//   console.log('users connected');
// });

const UserController = require('./users/UserController');
const GameController = require('./games/GameController');
const NotificationController = require('./notifications/NotificationController');

app.use('/api/users', UserController);
app.use('/api/games', GameController);
app.use('/api/notifications', NotificationController);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
  res.render('index');
});

module.exports = { app, http, io };