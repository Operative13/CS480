const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
    ws.send(JSON.stringify({msg: 'hi from server'}));
  });
});

router.ws('/user/:id', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
    ws.send(JSON.stringify({msg: `hi, ${req.params.id}; from, server`}));
  });
});

module.exports = { router };