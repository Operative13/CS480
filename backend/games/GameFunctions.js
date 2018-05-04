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
const EventEmitter = require('events');
const regionChangeEvent = new EventEmitter();
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

      // required when modifying and saving value(s) of a property of type Mixed
      // or of type Object in schema
      game.markModified('geolocations');
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
    delete game.geolocations[userId];
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

function isUserInAGame(userId) {
  return new Promise((resolve, reject) => {
    let id = String(userId);
    Game.findOne({[`geolocations.${id}`]: {$exists: true}}, (err, game) => {
      if (err) reject(err);
      resolve([!!game, game]);
    })
  })
}

/**
 * accurate by +/- 1 meter. delta lat equal to 50m
 */
const fiftyMetersInDeltaLatitude = 0.00045;

/**
 * accurate by +/- 1 meter. delta lon equal to 50m
 */
const fiftyMetersInDeltaLongitude = 0.00055;

/**
 * Measure the distance in meters between two points
 * (in latitude and longitude)
 * source of code: https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters
 * @param lat1
 * @param lon1
 * @param lat2
 * @param lon2
 * @returns {number} distance in meters
 */
function measure(lat1, lon1, lat2, lon2) {
  let R = 6378.137; // Radius of earth in KM
  let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
  let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
  let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
  Math.sin(dLon/2) * Math.sin(dLon/2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let d = R * c;
  return d * 1000; // meters
}

/**
 * Create numberOfRegions regions whose boundaries are within
 * the main circular boundary or playing field.
 * @param centerLat
 * @param centerLon
 * @param minRadius {Number} - in meters
 * @param maxRadius {Number} - in meters
 * @param owner
 * @param regionType
 * @param numberOfRegions
 * @param mainBoundaryLimit {Number} - max distance a randomly placed region
 *  can be created (in meters)
 * @returns {Array<Object>} the array of regions where each element is an
 *  object that contains a lat, lon, radius, owner, type
 * @throws {Error} if invalid regionType is given
 */
function createCircularRegions(centerLat, centerLon, minRadius=5, maxRadius=20,
                               owner=null, regionType="fort",
                               numberOfRegions=3, mainBoundaryLimit=150) {
  // validate regionType
  if (!GameConfig.regionTypes.hasOwnProperty(regionType)) {
    throw new Error(`invalid regionType given, regionType = ${regionType}`);
  }

  let [deltaLon, deltaLat] = [fiftyMetersInDeltaLongitude, fiftyMetersInDeltaLatitude];
  // scale factor for main boundary
  let scaleFactor = mainBoundaryLimit / 50;

  // delta lat and lon for main boundary
  let mainDeltaLat = deltaLat * scaleFactor;
  let mainDeltaLon = deltaLon * scaleFactor;

  let getRandomNumber = (min, max) => Math.random() * (max - min) + min;
  let regions = [];

  for (let i = 0; i < numberOfRegions; i++) {
    let lat = getRandomNumber(centerLat - mainDeltaLat, centerLat + mainDeltaLat);
    let lon = getRandomNumber(centerLon - mainDeltaLon, centerLon + mainDeltaLon);

    // all the info required to define a single circular zone
    let region = {
      lat,
      lon,
      radius: getRandomNumber(minRadius, maxRadius),
      owner,
      type: regionType,
    };

    regions.push(region);
  }

  return regions;
}

/**
 * Checks the users geolocations and updates the owner of each region
 * if there's a user in that capture region. If two users stand in the same
 * region, then the owner does not change.
 * @param game {mongoose.Document} - the game that holds info on users and
 *  regions for the game instance
 * @returns {Promise<mongoose.Document>} when the document is finished being
 *  modified and saved in MongoDB, return it in the resolution
 */
function updateRegions(game) {
  let updatedRegions = [];
  let aRegionWasChanged = false;

  // check each region
  for (let region of game['regions']) {
    let newOwner = '';

    for (let userId in game['geolocations']) {
      let geolocation = game['geolocations'][userId];

      // dist in meters between user location & capture zone center position
      let distance = measure(geolocation['lat'], geolocation['lon'],
        region['lat'], region['lon']);

      // this user is within the capture zone
      if (distance < region['radius']) {
        // another user is within the same capture zone
        if (newOwner) {
          newOwner = region['owner'];
        }
        // this is the 1st user detected in the zone & maybe the only user
        else {
          newOwner = userId;
        }
      }
    } // end users loop

    if (newOwner) {
      region['owner'] = newOwner;
      aRegionWasChanged = true;
    }
    updatedRegions.push(region);
  } // end regions loop

  if (aRegionWasChanged) {
    // console.log(`GameFunctions#updateRegions: game _id = ${game._id} regions
    //   changed to ${JSON.stringify(updatedRegions, null, 2)}`);

    regionChangeEvent.emit(String(game._id), updatedRegions);

    game['regions'] = updatedRegions;
    game.markModified('regions');

    return new Promise((resolve, reject) => {
      game.save()
        .then(game => resolve(game))
        .catch(err => reject(err))
    })
  } else {
    return new Promise(resolve => resolve(game));
  }
}

module.exports = {
  joinGame,
  joinGameByName,
  removeUser,
  createCircularRegions,
  updateRegions,
  regionChangeEvent,
};
