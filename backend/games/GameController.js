const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const ObjectId = require('mongoose').Types.ObjectId;

// local imports
const Game = new require('./Game');
const GameConfig = require('./GameConfiguration.js');
const {
  RequestRejectedException,
  BackendException
} = require('../exceptions/exceptions.js');
const UserFunctions = require('../users/UserFunctions');
const { joinGame, joinGameByName } = require('./GameFunctions');

/**
 * Send all games
 */
router.get('/', function(req, res) {
  Game.find({}, function(err, matches) {
    if (err) return res.status(500).send(err.message);
    res.status(200).send(matches);
  });
});

/**
 * Create a games. If room exists and joinIfExists from request body is true,
 * it'll try to join the existing room.
 * request body needs:
 * {
 *  myUserId: ObjectId,
 *  name: String,
 *  lat: Number,
 *  lon: Number,
 *  joinIfExists: Boolean,
 * }
 */
router.post('/create', async function (req, res) {
  if (!UserFunctions.isUser(req.body.myUserId)) {
    return res.status(400).send(`${req.body.myUserId} does not point to a user`);
  }

  Game.create({
      name: req.body.name,
    }, (err, game) => {
      // error occurred and it's not because this games room name already exists
      // or games was full, but we don't want to join it here
      if (err && (err.code !== 11000 || !req.body.joinIfExists)) {
        return res.status(500).send(err);
      }
      // room already exists, but try to join this existing room
      // or the games was just created
      else if (game || (err && req.body.joinIfExists)) {
        let playerInfo = {
          // use myUserId, or if not truthy, use other one
          myUserId: req.body.myUserId || req.body.userId,
          lat: req.body.lat || null,
          lon: req.body.lon || null,
        };
        // player created and is added to this games room or he is just added to
        // this games room
        return joinGameByName(req.body.name, playerInfo, res);
      }
      return res.status(500).send('creating games room screwed up');
  });
});

/**
 * request body needs:
 * {
 *  myUserId: ObjectId
 *  gameName: String,
 *  username: String,
 * }
 *
 * at least one of the following is required: gameName, username
 * where the username is the name of the users located in a games that you'd
 * like to join
 */
router.post('/join', async (req, res) => {
  // validate users id given
  if (!UserFunctions.isUser(req.body.myUserId)) {
    return res
      .status(400)
      .send(`Invalid user._id from myUserId = ${req.body.myUserId}`);
  }

  let userInfo = {myUserId: req.body.myUserId, lat: null, lon: null};

  // games room name to join was provided by requester
  if (req.body.gameName) {
    Game.findOne({'name': req.body.gameName}, (err, game) => {
      if (err) return res.status(500).send(err);
      return joinGame(game, userInfo, res);
    });
  }
  // username to join was provided by requester
  else if (req.body.username) {
    let userIdToJoin = await UserFunctions.getUserId(req.body.username);
    // given username to join isn't a users at all
    if (!userIdToJoin) {
      return res
        .status(400)
        .send(`Could not find user with username = ${req.body.username}`);
    }

    // wait for the query and callback to complete
    await Game.findOne(
      // janky JS syntax to allow for an expression to be used as a key
      {[`geolocations.${userIdToJoin}`]: {$exists: true}},
      (err, game) => {
        if (err) return res.status(500).send(err);
        return joinGame(game, userInfo, res);
      }
    );
  }
  // no username or gameName was provided in request body
  else {
    return res.status(400).send('Need to specify a username or games name to ' +
      'search for to join');
  }
});

/**
 * Get info on a specific games
 * E.g.: http://localhost:3000/api/games/5ac3fe68a79c5f523e8df030
 */
router.get('/:id', function(req, res) {
  Game.findById(req.params.id, function (err, game) {
    if (err) return res.status(500).send(err.message);
    if (!game) return res.status(404).send("No games found.");
    res.status(200).send(game);
  });
});

/**
 * Update games info
 * Needs: myUserId, lat, lon
 * in request body
 */
router.post('/:id', function(req, res) {
  Game.findOne({_id: req.params.id}, function(err, game) {
    try {
      if (!game.geolocations[req.body.myUserId]) {
        console.error(`user._id ${req.body.myUserId} not found in game room`);
      }

      game.geolocations[req.body.myUserId]['lat'] = req.body.lat;
      game.geolocations[req.body.myUserId]['lon'] = req.body.lon;
      game.save();
    } catch (error) {
      return res.status(400).send(error.message);
    }
    return res.status(200).send(game);
  });
});

module.exports = router;