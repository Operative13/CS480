const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const ObjectId = require('mongoose').Types.ObjectId;

// local imports
const Game = new require('./Game');
const GameConfig = require('./GameConfiguration.js');
const exceptions = require('../exceptions/exceptions.js');
const RequestRejectedException = exceptions.RequestRejectedException;
const UserFunctions = require('../user/UserFunctions');

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
 * Create a game. If room exists and joinIfExists from request body is true,
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
      // error occurred and it's not because this game room name already exists
      // or game was full, but we don't want to join it here
      if (err && (err.code !== 11000 || !req.body.joinIfExists)) {
        return res.status(500).send(err);
      }
      // room already exists, but try to join this existing room
      // or the game was just created
      else if (game || (err && req.body.joinIfExists)) {
        let playerInfo = {
          // use myUserId, or if not truthy, use other one
          myUserId: req.body.myUserId || req.body.userId,
          lat: req.body.lat || null,
          lon: req.body.lon || null,
        };
        // player created and is added to this game room or he is just added to
        // this game room
        return joinGameByName(req.body.name, playerInfo, res);
      }
      return res.status(500).send('creating game room screwed up');
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
 * where the username is the name of the user located in a game that you'd
 * like to join
 */
router.post('/join', async (req, res) => {
  // validate user id given
  if (!UserFunctions.isUser(req.body.myUserId)) {
    return res
      .status(400)
      .send(`Invalid user._id from myUserId = ${req.body.myUserId}`);
  }

  let userInfo = {myUserId: req.body.myUserId, lat: null, lon: null};

  // game room name to join was provided by requester
  if (req.body.gameName) {
    Game.findOne({'name': req.body.gameName}, (err, game) => {
      if (err) return res.status(500).send(err);
      return joinGame(game, userInfo, res);
    });
  }
  // username to join was provided by requester
  else if (req.body.username) {
    let userIdToJoin = await UserFunctions.getUserId(req.body.username);
    // given username to join isn't a user at all
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
    return res.status(400).send('Need to specify a username or game name to ' +
      'search for to join');
  }
});

function joinGame(game, userInfo, httpResponse, error) {
    if (error) return httpResponse.status(500).send(error);
    if (!game) {
      return httpResponse
        .status(400)
        .send(`No game found, game =\n${JSON.stringify(game, null, 2)}`);
    }

    try {
      game = addPlayerToGame(game, userInfo);
    } catch (error) {
        if (error instanceof RequestRejectedException) {
          // room was full already
          return httpResponse.status(400).send(error.message);
        }
        // server error encountered
        return httpResponse.status(500).send(error.message);
    }
    // successfully joined the game room
    return httpResponse.status(200).send(game);
}

/**
 * Attempts to put the user in a game room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {String} gameName name property / key of the game Document
 * @param {Object} userInfo contains the following keys: userId, lat, lon
 * @param httpResponse response created by express when the original HTTP
 * request was made
 * @returns {undefined, Response}
 */
function joinGameByName(gameName, userInfo, httpResponse) {
  Game.findOne({name: gameName}, (err, game) => {
    return joinGame(game, userInfo, httpResponse, err);
  });
}

/**
 * @throws {RequestRejectedException} thrown when room is already full
 * @throws {exceptions.BackendException} if Document is screwed up
 * @param {mongoose.Document} game
 * @param {Object} userInfo contains the following keys: userId, lat, lon
 * @returns {mongoose.Document} game with updated value for user, gets saved
 */
function addPlayerToGame(game, userInfo) {
  // if game room is at capacity
  if (game.users.length >= GameConfig.maxUsers ||
    (game.geolocations && Object.keys(game.geolocations).length >= GameConfig.maxUsers)) {

    throw new exceptions.RequestRejectedException(
      `${game.name} already has max users`);
  }

  // geolocations is missing from Document entirely somehow
  if (!game.geolocations) {
    throw new exceptions.BackendException(
      `${JSON.stringify(game, null, 2)}\ngeolocations not found in Game document`);
  }

  game.users.push(userInfo.myUserId);
  game.geolocations[userInfo.myUserId] = {
    lat: userInfo.lat,
    lon: userInfo.lon
  };

  // required when modifying and saving value(s) of a property of type Mixed
  // or of type Object in schema
  game.markModified('geolocations');
  game.save();
  return game;
}

/**
 * Get info on a specific game
 * E.g.: http://localhost:3000/api/games/5ac3fe68a79c5f523e8df030
 */
router.get('/:id', function(req, res) {
  Game.findById(req.params.id, function (err, game) {
    if (err) return res.status(500).send(err.message);
    if (!game) return res.status(404).send("No game found.");
    res.status(200).send(game);
  });
});

/**
 * Update game info
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