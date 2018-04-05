const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Game = new require('./Game');
const GameConfig = require('./GameConfiguration.js');
const exceptions = require('../exceptions/exceptions.js');
const RequestRejectedException = exceptions.RequestRejectedException;

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
 * Create or join a new game
 * Needs:
 * myPlayerId, name (of game), lat, lon
 * defined in request body
 */
router.post('/', function (req, res) {
  Game.create({
      name: req.body.name,
    }, (err, game) => {
      // error occurred and it's not because this game room name already exists
      if (err && err.code !== 11000) {
        return res.status(500).send(err);
      } else {
        let playerInfo = {
          // use myPlayerId, or if not truthy, use playerId from request body
          myPlayerId: req.body.myPlayerId || req.body.playerId,
          lat: req.body.lat,
          lon: req.body.lon
        };
        // player created and is added to this game room or he is just added to
        // this game room
        return joinGameRoom(req.body.name, playerInfo, res);
      }
  });
});

/**
 * Attempts to put the player in a game room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {String} gameName name property / key of the game Document
 * @param {Object} playerInfo contains the following keys: playerId, lat, lon
 * @param httpResponse response created by express when the original HTTP
 * request was made
 */
function joinGameRoom(gameName, playerInfo, httpResponse) {
  Game.findOne({name: gameName}, (err, game) => {
    if (err) return httpResponse.status(500).send(error);
    try {
      game = addPlayerToGame(game, playerInfo);
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
  });
}

/**
 * @throws {RequestRejectedException} thrown when room is already full
 * @param {mongoose.Document} game
 * @param {Object} playerInfo contains the following keys: playerId, lat, lon
 *
 * @returns {mongoose.Document} game with updated value for player, gets saved
 */
function addPlayerToGame(game, playerInfo) {
  // if game room is at capacity
  if (game.players.length >= GameConfig.maxPlayers ||
    (game.geolocations && Object.keys(game.geolocations).length >= GameConfig.maxPlayers)) {

    throw new exceptions.RequestRejectedException(
      `${game.name} already has max players`);
  }

  // geolocations is missing from Document entirely somehow
  if (!game.geolocations) {
    throw new exceptions.BackendException(
      `${JSON.stringify(game, null, 2)}\ngeolocations not found in Game document`);
  }

  game.players.push(playerInfo.myPlayerId);
  game.geolocations[playerInfo.myPlayerId] = {
    lat: playerInfo.lat,
    lon: playerInfo.lon
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
 * Needs: myPlayerId, lat, lon
 * in request body
 */
router.post('/:id', function(req, res) {
  Game.findOne({_id: req.params.id}, function(err, game) {
    try {
      if (!game.geolocations[req.body.myPlayerId]) {
        console.error(`user._id ${req.body.myPlayerId} not found`);
      }

      game.geolocations[req.body.myPlayerId]['lat'] = req.body.lat;
      game.geolocations[req.body.myPlayerId]['lon'] = req.body.lon;
      game.save();
      // game.save()
      //   .then((game) => {return res.status(200).send(game);})
      //   .catch((err) => {return res.status(400).send(err.message);});

    } catch (error) {
      return res.status(400).send(error.message);
    }
    return res.status(200).send(game);
  });
});

module.exports = router;