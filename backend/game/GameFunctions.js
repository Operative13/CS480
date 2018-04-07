const exceptions = require('../exceptions/exceptions');
const GameConfig = require('./GameConfiguration');
const Game = new require('./Game');

module.exports = {joinGame, joinGameByName};

/**
 * Attempts to put the user in a game room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {mongoose.Document} game the game you want the user to join
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
 * Attempts to put the user in a game room given the name of the game room
 * if that fails (server error or room is full), status > 299 and error message
 * is sent back in response body
 * @param {String} gameName name property / key of the game Document
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