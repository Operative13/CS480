const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const ObjectId = require('mongoose').Types.ObjectId;

// local imports
const GameConfig = require('./GameConfiguration');
const Game = new require('./Game');
const UserFunctions = require('../users/UserFunctions');
const GameLogic = require('./GameLogic');
const {
  joinGame,
  joinGameByName,
} = require('./GameManagement');
const GameManagement = require('./GameManagement');
const {
  requestError,
  serverError,
  success,
} = require('../utility/ResponseHandler');

/**
 * Get all games
 */
router.get('/', function(req, res) {
  Game.find({}, function(err, games) {
    if (err) return requestError(res, err);
    success(res, games);
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
router.post('/create', function(req, res) {
  // console.log(JSON.stringify(GameConfig, null, 2));
  let lat = req.body.lat;
  let lon = req.body.lon;

  if (!req.body.lat || !req.body.lon) {
    let msg = `lat & lon should be defined, lat = ${lat} lon = ${lon}`;
    return requestError(res, new Error(msg));
  }

  UserFunctions.isUser(req.body.myUserId)
    .then(isUser => {
      if (!isUser) {
        let msg = `there is no user with id of ${req.body.myUserId}`;
        return requestError(res, new Error(msg));
      }

      let gameInfo = {
        name: req.body.name,
        regions: GameLogic.createCircularRegions(
          lat, lon, minRadius=5, maxRadius=20, owner=null, regionType="fort"
        ),
        scores: {},
      };

      Game.create(
        gameInfo,
        (err, game) => {
        // error occurred and it's not because this games room name already
        // exists or games was full, but we don't want to join it here
        if (err && (err.code !== 11000 || !req.body.joinIfExists)) {
          return serverError(res, err);
        }

        // room already exists, but try to join this existing room
        // or the game was just created
        else if (game || (err && req.body.joinIfExists)) {
          let userInfo = {
            // use myUserId, or if not truthy, use other one
            userId: req.body.myUserId || req.body.userId,
            lat: req.body.lat || 0,
            lon: req.body.lon || 0,
          };

          // player created and is added to this games room or he is just added
          // to this games room
          joinGameByName(req.body.name, userInfo, res)
            .then(() => {
              GameLogic.startGame(game._id)
                .then(message => console.log(message))
                .catch(err => console.error(err));

              return res;
            })
            .catch(err => err);
        }

        else {
          return serverError(res, new Error('creating game room screwed up'));
        }
      });
    })
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
router.post('/join', (req, res) => {
  UserFunctions.isUser(req.body.myUserId)
    .then(isUser => {
      if (!isUser) {
        let msg = `no such user: ${req.body.myUserId}`;
        return requestError(res, new Error(msg));
      }

      let userInfo = {userId: req.body.myUserId, lat: 0, lon: 0};

      // games room name to join was provided by requester
      if (req.body.gameName) {
        Game.findOne({'name': req.body.gameName}, (err, game) => {
          if (err) return requestError(res, err);

          // return joinGame(game, userInfo, res);
          joinGame(game, userInfo, res)
            .then(() => res)
            .catch(err => err)
        });
      }

      // username to join was provided by requester
      else if (req.body.username) {
        UserFunctions.getUserId(req.body.username)
          .then(userIdToJoin => {
            // given username to join isn't a users at all
            if (!userIdToJoin) {
              let msg = `Could not find user, username = ${req.body.username}`;
              return requestError(res, new Error(msg));
            }

            Game.findOne(
              // janky JS syntax to allow for an expression to be used as a key
              {[`geolocations.${userIdToJoin}`]: {$exists: true}},
              (err, game) => {
                if (err) return requestError(res, err);

                // return joinGame(game, userInfo, res);
                joinGame(game, userInfo, res)
                  .then(() => res)
                  .catch(err => err)
              }
            );
          })
      }

      // no username or gameName was provided in request body
      else {
        return requestError(
          res,
          new Error('Need to specify a username or games name to ' +
            'search for to join')
        );
      }
    })
    .catch(err => err);
});

/**
 * Have the given user of userId leave the game
 * request body should contain:
 * {
 *  userId: String,
 * }
 */
router.post('/leave/:id', (req, res) => {
  if (!req.body.userId) {
    let msg = `no userId given, userId = ${req.body.userId}`;
    return requestError(res, new Error(msg));
  }

  Game.findById(req.params.id, function (err, game) {
    if (err) return requestError(res, err);
    if (!game) {
      let msg = `no game found with _id = ${req.params.id}`;
      return requestError(res, new Error(msg));
    }

    GameManagement.removeUser(game, req.body.userId)
      .then((game) => success(res, game))
      .catch(err => requestError(res, err));
  });
});

/**
 * Get info on a specific games
 * E.g.: http://localhost:3000/api/games/5ac3fe68a79c5f523e8df030
 */
router.get('/:id', function(req, res) {
  if (!req.params.id) {
    return requestError(res, new Error('no id found in url route for a game'));
  }

  Game.findById(req.params.id, function (err, game) {
    if (err) return requestError(res, err);
    if (!game) {
      let msg = `no game found for game._id = ${req.params.id}`;
      return requestError(res, new Error(msg));
    }
    success(res, game);
  });
});

/**
 * Update games info
 * Needs: myUserId, lat, lon
 * in request body
 */
router.post('/:id', function(req, res) {
  Game.findOne({_id: ObjectId(req.params.id)}, function(err, game) {
    if (err) return requestError(res, err);
    try {
      if (!game.geolocations[req.body.myUserId]) {
        let msg = `user._id = ${req.body.myUserId} not found in game room`;
        return requestError(res, new Error(msg));
      }

      game.geolocations[req.body.myUserId]['lat'] = req.body.lat;
      game.geolocations[req.body.myUserId]['lon'] = req.body.lon;

      game.markModified('geolocations');
      game.save()
        .then(savedGame => {
          // update capture zones ownerships
          GameLogic.updateRegions(savedGame)
            .then(savedGame2 => success(res, savedGame2))
            .catch(err => serverError(res, err))
        })
        .catch(err => serverError(res, err))
    } catch (error) {
      return requestError(res, error);
    }
  });
});

router.ws('/:id/regions', function(ws, req) {
  GameLogic.regionChangeEvent.on(String(req.params.id), function(regions) {
    ws.send(JSON.stringify(regions));
  });
});

module.exports = router;