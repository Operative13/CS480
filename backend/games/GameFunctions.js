const exceptions = require('../exceptions/exceptions');
const GameConfig = require('./GameConfiguration');
const Game = new require('./Game');
const {
  RequestRejectedException,
  BackendException
} = require('../exceptions/exceptions');
const UserFunctions = require('../users/UserFunctions');

/**
 * Attempts to put the users in a games room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {mongoose.Document} game the games you want the users to join
 * @param {Object} userInfo follows schema: {
 *    myUserId: String,
 *    lat: Number,
 *    lon: Number,
 *  }
 * @param httpResponse response created by express when the original HTTP
 * request was made
 * @param error an error or exception passed from a callback or promise
 * @returns {undefined, Response}
 */
function joinGame(game, userInfo, httpResponse, error, leavePreviousGame=true) {
    if (error) return httpResponse.status(500).send(error);
    if (!game) {
      return httpResponse
        .status(400)
        .send(`No game found, game =\n${JSON.stringify(game, null, 2)}`);
    }

    try {
      game = addUser(game, userInfo);
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
 * Attempts to put the users in a games room given the name of the games room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {String} gameName name property / key of the games Document
 * @param {Object} userInfo follows schema: {
 *    myUserId: String,
 *    lat: Number,
 *    lon: Number,
 *  }
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
 * @throws {BackendException} if Document is screwed up
 * @param {mongoose.Document} game
 * @param {Object} userInfo contains the following keys: userId, lat, lon
 * @returns {mongoose.Document} games with updated value for users, gets saved
 */
async function addUser(game, userInfo) {
  // if games room is at capacity
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

  let addUserIn = () => {
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
  };

  isUserInAGame(userInfo.userId)
    .catch(err => {throw err})
    .then((isInAGame, gameUserIsAlreadyIn) => {
      if (isInAGame) {
        removeUser(gameUserIsAlreadyIn, userInfo.userId).then(() => addUserIn());
      } else {
        return addUserIn();
      }
    });
}

/**
 * Removes a user from a game given the game document and the userId
 * @param game
 * @param userId - id of user who is going to be removed from the game
 * @returns {Promise} resolves or rejects with value to be sent with response
 */
function removeUser(game, userId) {
  return new Promise((resolve, reject) => {
    delete game.geolocations[userId];
    // we're actually comparing a String and an ObjectId
    let removeIndex = game.users.findIndex((id) => id == userId);
    if (removeIndex === -1) reject(`could not find user of id ${userId} in list of users for this game`);

    // remove the userId from the array of userIds
    let begin = game.users.slice(0, removeIndex);
    let end = game.users.slice(removeIndex + 1, game.users.length + 1);
    game.users = begin.concat(end);

    // no more users in this game
    if (!game.users.length) {
      deleteGame(game._id)
        .then(() => resolve(game))
        .catch(err => reject(err))
    } else {
      game.markModified('geolocations');
      game.save()
        .then(savedGame => resolve(savedGame))
        .catch(err => reject(err.message));
    }
  });
}

function deleteGame(gameId) {
  return new Promise((resolve, reject) => {
    Game.remove({_id: gameId}, (err, game) => {
      if (err) reject(err);
      if (!game) reject('game not found');
      resolve(game);
    });
  });
}

async function isUserInAGame(userId) {
  Game.findOne({[`geolocations.${userId}`]: {$exists: true}}, (err, game) => {
    if (err) throw err;
    return [!!game, game];
  })
}

module.exports = {joinGame, joinGameByName, removeUser};
