const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Game = new require('./Game');
const GameConfig = require('./GameConfiguration.js');
const exceptions = require('../exceptions/exceptions.js');

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
      if (err) {
        // duplicate key error (game with this name already exists)
        if (err.code === 11000) {
          // try to join the room
        }
        return res.status(500).send(err);
      }
      
      return res.status(200).send(`created or joined\n${game}`);
  });
});

function joinGameRoom(gameId, user, callback) {
  Game.findOne({_id: gameId}, callback=(err, game) => {
    if (err) return err;

  })
}

/**
 *
 * @param {mongoose.Document} game
 * @param {Object} playerInfo contains the following keys: playerId, lat, lon
 */
function addPlayerToGame(game, playerInfo) {
  if (game.players.length >= GameConfig.maxPlayers ||
    game.geolocations.length >= GameConfig.maxPlayers) {
    return new exceptions.BackendException(
      `${game.name} already has max players`);
  }

  game.players.push(playerInfo.myPlayerId);
  let info = {
    playerId: playerInfo.myPlayerId,
    lat: playerInfo.lat || null,
    lon: playerInfo.lon || null,
  };
  game.geolocations.push(info);
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