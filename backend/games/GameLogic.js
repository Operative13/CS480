/**
 * File: GameLogic.js
 * Functions that define game rules, end conditions, update loops,
 * and more.
 */
let __doc__;

const exceptions = require('../exceptions/exceptions');
var GameConfig = require('./GameConfiguration');
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

/**
 * Starts the game timer and begins to continuously award points per capture
 * zone owned.
 * @param gameId {ObjectId} - id of the game that's starting
 * @returns {Promise}
 */
function startGame(gameId) {
  // GameConfig = require('./GameConfiguration');
  startGameTimer(gameId);
  return startAwardingPointsForCaptureZones(gameId);
}

/**
 * Begins a loop that will continuously check for owners of regions and
 * award them points for each region in each loop
 * @param gameId {ObjectId} - id of the game
 * @returns {Promise} - resolves once the game has been deleted
 */
function startAwardingPointsForCaptureZones(gameId) {
  /**
   * Wait some time.
   * @param time {Number} - amount of time to wait in seconds
   * @returns {Promise<void>}
   */
  function wait(time) {
    return new Promise(resolve => {
      setTimeout(
        () => resolve(),
        time * 1000,
      );
    })
  }

  return new Promise(async (resolve, reject) => {
    let done = false;

    while (!done) {
      console.log('loop');
      // find the game doc by it's _id
      Game.findOne({_id: ObjectId(gameId)}, async (err, game) => {
        if (err || !game) {
          done = true;
          return resolve(
            `id = ${gameId} doesn't exists. It might've been deleted if all users left.`);
        }

        // winner has been set, implies the game is over
        if (game.winner) {
          done = true;
          return resolve(`${game.winner} won ${gameId}`);
        }

        // iterate over every region for this game
        for (let region of game['regions']) {
          let owner = String(region['owner']);
          if (owner) {
            game['scores'][owner] += GameConfig.pointsPerCaptureZone;

            // check if the user won
            if (game['scores'][owner] >= GameConfig.pointsNeededToWin) {
              done = true;
              game.winner = owner;

              // save doc and resolve this function
              return await game.save()
                .then(game => resolve(`${game.winner} won ${gameId}`))
                .catch(reject);
            }
          }
        }

        game.markModified('scores');
        await game.save().catch(err => console.error(err));
      });

      // wait some time
      await wait(GameConfig.captureZonePointsAwardedPeriod);
    }
  });
}

function startGameTimer(gameId) {
  return new Promise((resolve, reject) => {
    Game.findOne({_id: ObjectId(gameId)}, (err, game) => {
      if (err || !game) {
        reject(err || `startGameTimer: no such game, _id = ${gameId}`);
      }

      game.startTime = new Date();
      game.save().catch(err => reject(err));

      setTimeout(
        () => {
          endGame(gameId)
            .then(resolve)
            .catch(reject)
        },
        GameConfig.gameDuration * 1000
      );
    });
  });
}

function endGame(gameId) {
  return new Promise((resolve, reject) => {
    Game.findOne({_id: ObjectId(gameId)}, (err, game) => {
      if (err || !game) return reject(err || `endGame: no such game, _id = ${gameId}`);

      let highScore = -1;
      let winner = null;

      for (let userId in game.scores) {
        if (userId) {
          let score = game.scores[userId];
          if (score > highScore) {
            highScore = score;
            winner = userId;
          }
        }
      }

      game.winner = winner;
      game.save()
        .then(savedGame => resolve(game))
        .catch(err => reject(err))
    });
  });
}

module.exports = {
  fiftyMetersInDeltaLatitude,
  fiftyMetersInDeltaLongitude,
  createCircularRegions,
  updateRegions,
  regionChangeEvent,
  startGame,
};