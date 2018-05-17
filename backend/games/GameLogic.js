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
 * Get the lat and lon a certain number of meters north and east
 * source of code: https://gis.stackexchange.com/a/2980
 * @param startLat {Number} - origin
 * @param startLon {Number} - origin
 * @param distanceNorth {Number} - distance north in meters (negative if south)
 * @param distanceEast {Number} - distance east in meters (negative if west)
 * @returns {[Number, Number]} lat, lon
 */
function getLatLon(startLat, startLon, distanceNorth, distanceEast) {
 //Earth’s radius, sphere
 let R=6378137;

 //Coordinate offsets in radians
 let dLat = distanceNorth/R;
 let dLon = distanceEast/(R*Math.cos(Math.PI* startLat/180));

 //OffsetPosition, decimal degrees
 let lat = startLat + dLat * 180 / Math.PI;
 let lon = startLon + dLon * 180/Math.PI;

 return [lat, lon];
}


/**
 * @deprecated
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
 * Create numberOfRegions regions whose boundaries are within
 * the main circular boundary or playing field.
 * @param centerLat
 * @param centerLon
 * @param radius {Number} - size of each region created in meters
 * @param owner {String}
 * @param regionType
 * @param numberOfRegions
 * @param mainBoundaryLimit {Number} - max distance a randomly placed region
 *  can be created (in meters)
 * @returns {Array<Object>} the array of regions where each element is an
 *  object that contains a lat, lon, radius, owner, type
 * @throws {Error} if invalid regionType is given
 */
function createEvenlyDistributedRegions(
    centerLat, centerLon, radius=7, owner=null,
    regionType="fort", numberOfRegions=5, mainBoundaryLimit=20) {

  // validate regionType
  if (!GameConfig.regionTypes.hasOwnProperty(regionType)) {
    throw new Error(`invalid regionType given, regionType = ${regionType}`);
  }

  // first region created directly north of user start position
  let theta = Math.PI / 2;

  // angle between user, previous region, and next region (in radians)
  let deltaTheta = 2 * Math.PI / numberOfRegions;
  let regions = [];

  for (let i = 0; i < numberOfRegions; i++) {
    // x
    let east = Math.cos(theta) * mainBoundaryLimit;
    // y
    let north = Math.sin(theta) * mainBoundaryLimit;
    let [lat, lon] = getLatLon(centerLat, centerLon, north, east);

    regions.push({
      lat,
      lon,
      radius,
      owner,
      type: regionType,
      troops: GameConfig.initialTroopsForCaptureZone,
    });

    theta += deltaTheta;
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
    // emit an internal event that'll in turn send a message using a websocket
    regionChangeEvent.emit(String(game._id), {regions: updatedRegions});

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
  return gameLoop(gameId);
}

/**
 * Begins a loop that will continuously check for owners of regions and
 * award them points for each region in each loop
 * @param gameId {ObjectId} - id of the game
 * @returns {Promise} - resolves once the game has been deleted
 */
function gameLoop(gameId) {
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

        await regionsLoop(game).catch(reject);

        game.markModified('scores');
        game.markModified('regions');
        await game.save().catch(err => console.error(err));

        // assuming at least one zone is owned and consequently, need to tell
        // players that the troops for this zone(s) has increased
        regionChangeEvent.emit(game._id, {regions: game.regions});
      });

      // wait some time
      await wait(GameConfig.gameLoopPeriod);
    }
  });
}

async function regionsLoop(game) {
  // iterate over every region for this game
  for (let region of game['regions']) {
    await updateScore(game, region).catch(err => err);
    updateTroops(game, region);
  }
}

async function updateScore(game, region) {
  let owner = String(region['owner']);
  if (owner) {
    game['scores'][owner] += GameConfig.pointsPerCaptureZone;

    // check if the user won
    if (game['scores'][owner] >= GameConfig.pointsNeededToWin) {
      game.winner = owner;

      // save doc and resolve this function
      return await game.save()
        .then(game => resolve(`${game.winner} won ${gameId}`))
        .catch(err => err);
    }
  }
}

function updateTroops(game, region) {
  // if there's an owner
  if (region.owner) {
    region.troops += GameConfig.troopsPerCaptureZone;
  }
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

/**
 * Transfer troops between a user and his base. He must be owner and in range.
 * Negative number of troops to transfer the other way.
 * If more troops transferred from a source than available, then transfer as
 * many as possible and continue normal execution.
 * @param game {mongoose.Document}
 * @param userId {String}
 * @param regionIndex {Number}
 * @param troops {Number}
 * @returns {Promise} resolves with saved game doc or rejects with error
 *  if error occurs
 */
function transferTroopsToBase(game, userId, regionIndex, troops) {
  return new Promise(async (resolve, reject) => {
    let region = game.regions[regionIndex];
    // check if userId is owner
    if (region.owner !== userId) {
      reject(`${userId} does not own this region, & may not transfer troops`);
    }

    // check if user is in range of region
    let geolocation = game.geolocations[userId];
    if (measure(geolocation.lat, geolocation.lon, region.lat, region.lon) > region.radius) {
      reject(`${userId} is not in range of the region to transfer troops`);
    }

    let troopsOnPerson = game.troops[userId] - troops;
    let troopsInBase = region.troops + troops;

    // tried to transfer more than what the user has to base
    if (troopsOnPerson < 0) {
      troopsOnPerson = 0;
      troopsInBase = region.troops + game.troops[userId];
    }
    // tried to transfer more than what the base has to user
    else if (troopsInBase < 0) {
      troopsInBase = 0;
      troopsOnPerson = region.troops + game.troops[userId];
    }

    // add troops to base
    region.troops = troopsInBase;

    // add troops * -1 to user's troops
    game.troops[userId] = troopsOnPerson;

    // return promise from game save
    game.markModified('regions');
    game.markModified('troops');
    await game.save()
      .then(savedGame => {
        regionChangeEvent.emit(
          game._id,
          {
            regions: savedGame.regions,
            troops: savedGame.troops,
          }
        );
        resolve(savedGame);
      })
      .catch(reject);
  });
}

module.exports = {
  fiftyMetersInDeltaLatitude,
  fiftyMetersInDeltaLongitude,
  createCircularRegions,
  createEvenlyDistributedRegions,
  updateRegions,
  regionChangeEvent,
  startGame,
  transferTroopsToBase,
};