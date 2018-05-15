/**
 * File: GameMangement.js
 * Functions to help manage removing and adding users to a game.
 */
let __doc__;

const exceptions = require('../exceptions/exceptions');
const GameConfig = require('./GameConfiguration');
const Game = new require('./Game');
const {
  RequestRejectedException,
  BackendException
} = require('../exceptions/exceptions');
const UserFunctions = require('../users/UserFunctions');
const errorToJson = require('../exceptions/exceptions').errorToJson;
const {
  requestError,
  serverError,
  success,
} = require('../utility/ResponseHandler');
const ObjectId = require('mongoose').Types.ObjectId;
const { logger } = require('../app');

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
 * @returns {Response} resolution value is the modified response given
 */
async function joinGame(game, userInfo, httpResponse, error,) {
    if (error) return requestError(httpResponse, error);
    if (!game) {
      let msg = `No game found`;
      return requestError(httpResponse, new Error(msg));
    }

    addUser(game, userInfo)
      .then(savedGame => {return success(httpResponse, savedGame)})
      .catch(err => {
        return err instanceof RequestRejectedException ?
          requestError(httpResponse, err) :
          serverError(httpResponse, err);
      });
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
 * @returns {Promise}
 */
async function joinGameByName(gameName, userInfo, httpResponse) {
  Game.findOne({name: gameName}, (err, game) => {
    joinGame(game, userInfo, httpResponse, err)
      .then(response => response)
      .catch(err => err)
  });
}

/**
 * Adds a user in the game
 * @throws {RequestRejectedException} thrown when room is already full
 * @throws {BackendException} if Document is screwed up
 * @param {mongoose.Document} game
 * @param {Object} userInfo contains the following keys: userId, lat, lon
 * @returns {Promise<mongoose.Document>} games with updated value for users, gets saved
 */
function addUser(game, userInfo) {
  return new Promise((resolve, reject) => {
    // if games room is at capacity
    if (game.users.length >= GameConfig.maxUsers ||
      (game.geolocations && Object.keys(game.geolocations).length >= GameConfig.maxUsers)) {

      reject(new exceptions.RequestRejectedException(
        `game.name = ${game.name} already has max users permitted`));
    }

    // geolocations is missing from Document entirely somehow
    if (!game.geolocations) {
      let msg = `geolocations not found: game.name = ${game.name}`;
      reject(new exceptions.BackendException(msg));
    }

    function addUserIn () {
      return new Promise((resolve, reject) => {
        game.users.push(userInfo.userId);
        game.geolocations[userInfo.userId] = {
          lat: userInfo.lat,
          lon: userInfo.lon
        };

        if (!game.scores) {
          game.scores = {};
        }
        game.scores[userInfo.userId] = 0;
        game.troops[userInfo.userId] = GameConfig.initialTroopsForPlayer;

        // required when modifying and saving value(s) of a property of type Mixed
        // or of type Object in schema
        game.markModified('geolocations');
        game.markModified('scores');
        game.save()
          .then((savedGame) => resolve(savedGame))
          .catch(err => reject(err))
      })
    }

    isUserInAGame(userInfo.userId)
      .then(([isInAGame, gameUserIsAlreadyIn]) => {
        if (isInAGame) {
          removeUser(gameUserIsAlreadyIn, userInfo.userId, deleteEmptyGame=gameUserIsAlreadyIn.name !== game.name)
            .then(() => resolve(addUserIn()))
            .catch(err => reject(err))
        } else {
          resolve(addUserIn());
        }
      })
      .catch(err => reject(err))
    });
}

/**
 * Removes a user from a game given the game document and the userId
 * @param game
 * @param userId - id of user who is going to be removed from the game
 * @param deleteEmptyGame {boolean} - if true, deletes the game from the
 *  collection if it no longer has any users in it
 * @returns {Promise} resolves or rejects with value to be sent with response
 */
function removeUser(game, userId, deleteEmptyGame=true) {
  return new Promise((resolve, reject) => {
    // geolocations attribute was getting removed after a user left game in
    // frontend of app
    if (!game.geolocations) {
      let msg = `game is missing geolocations\n${JSON.stringify(game)}`;
      // return reject(new Error(msg));
      console.warn(msg);
    } else {
      if (userId in game.geolocations) {
        delete game.geolocations[userId];
      }
      // still need to remove userId from game.users if it's there, just warn here
      else {
        console.warn(`game.name = ${game.name} had no user with id of ${userId} in its geolocations`);
      }
    }

    // we're actually comparing a String and an ObjectId
    let removeIndex = game.users.findIndex((id) => id == userId);
    if (removeIndex === -1) {
      let msg = `could not find user id ${userId} in game ${game.name}`;
      reject(new Error(msg));
    }

    // remove the userId from the array of userIds
    let begin = game.users.slice(0, removeIndex);
    let end = game.users.slice(removeIndex + 1, game.users.length + 1);
    game.users = begin.concat(end);

    // no more users in this game
    if (!game.users.length && deleteEmptyGame) {
      deleteGame(game._id)
        .then(() => resolve(game))
        .catch(err => reject(err))
    } else {
      game.markModified('geolocations');
      game.save()
        .then(savedGame => resolve(savedGame))
        .catch(err => reject(err));
    }
  });
}

/**
 * Delete the game document whose _id === gameId
 * @param gameId {ObjectId}
 * @returns {Promise}
 */
function deleteGame(gameId) {
  return new Promise((resolve, reject) => {
    Game.remove({_id: gameId}, (err, game) => {
      if (err) reject(err);
      if (!game) {
        let msg = `no game found for _id = ${gameId}`;
        reject(new Error(msg));
      }
      resolve(game);
    });
  });
}

/**
 * Check if a user is in a game
 * @param userId {String}
 * @returns {Promise<[Boolean, Document]>} - an array with 1st element
 *  indicating whether the user is in a game or not. 2nd element being the
 *  game that the user is in (if any; could be null if none)
 */
function isUserInAGame(userId) {
  return new Promise((resolve, reject) => {
    let id = String(userId);
    Game.findOne({[`geolocations.${id}`]: {$exists: true}}, (err, game) => {
      if (err) reject(err);
      resolve([!!game, game]);
    })
  })
}

module.exports = {
  joinGame,
  joinGameByName,
  removeUser,
};
