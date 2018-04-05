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
      let playerInfo = {
        myPlayerId: req.body.myPlayerId,
        lat: req.body.lat,
        lon: req.body.lon
      };
      console.log(game);

      // error occurred and it's not because this game room name already exists
      if (err && err.code !== 11000) {
        return res.status(500).send(err);
      } else {
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
      addPlayerToGame(game, playerInfo);
    } catch (error) {
        if (error instanceof RequestRejectedException) {
          // room was full already
          return httpResponse.status(400).send(error.message);
        }
        // server error encountered
        return httpResponse.status(500).send(error.message);
    }
    // successfully joined the game room
    return httpResponse.status(200).send(`created or joined\n${game}`);
  });
}

/**
 * @throws {RequestRejectedException} thrown when room is already full
 * @param {mongoose.Document} game
 * @param {Object} playerInfo contains the following keys: playerId, lat, lon
 * @returns {mongoose.Document} game with updated value for player, gets saved
 */
function addPlayerToGame(game, playerInfo) {
  console.log(game);
  // if game room is at capacity
  if (game.players.length >= GameConfig.maxPlayers ||
    game.geolocations.length >= GameConfig.maxPlayers) {

    throw new exceptions.RequestRejectedException(
      `${game.name} already has max players`);
  }

  game.players.push(playerInfo.myPlayerId);
  game.geolocations.push(playerInfo);
  game.save();
  return game;
}

/**
 * Get info on a specific game
 * E.g.: http://localhost:3000/api/games/5ac3fe68a79c5f523e8df030
 */
router.get('/:id', function(req, res) {
  Game.findById(req.params.id, function (err, match) {
    if (err) return res.status(500).send(err.message);
    if (!match) return res.status(404).send("No game found.");
    res.status(200).send(match);
  });
});

/**
 * Update game info
 * Needs: id (User _id: ObjectId), myPlayerId, lat, lon
 * in request body
 */
router.post('/:id', function(req, res) {
  Game.find({_id: req.params.id}, function(err, match) {
    // TODO: fix this later, better query
    for (let i = 0; i < match.geolocations.length; i++) {
      if (match.geolocations[i].playerId === req.body.myPlayerId) {
        match.geolocations[req.body.myPlayerId] = {
          lat: req.body.lat,
          lon: req.body.lon,
        };
        match.save();
        return res.status(200).send(match);
      }
    }
  });
});

module.exports = router;