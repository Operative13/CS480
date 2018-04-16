// MongoDB imports
const mongoose = new require('mongoose');
const mongoDbUri = require('./config').mongoDbUri;
const UserModelImported = new require('../backend/users/User');
const GameModelImported = new require('../backend/games/Game');
// the actual models we're using with proper connection to correct mongoDB URI
var UserModel = null;
var GameModel = null;

const assert = require('assert');

// sdk imports
const BaseConnection = require('./lib/BaseConnection');
const User = require('./lib/User');
const Game = require('./lib/Game');
const baseConnection = new BaseConnection('localhost', '3000');
const user = new User(baseConnection);
const game = new Game(baseConnection);

/**
 * Connect to the proper mongoDB URI
 */
before(function() {
  if (!(mongoDbUri.includes('test') || mongoDbUri.includes('localhost') ||
    mongoDbUri.includes('127.0.0.1')))
    throw new Error(`${mongoDbUri} might not be safe to use for tests`);

  let conn = mongoose.createConnection(mongoDbUri);
  UserModel = conn.model('User', UserModelImported.schema);
  GameModel = conn.model('Game', GameModelImported.schema);
});

describe('list of users', () => {
  it('should be equal to empty array', () => {
      UserModel.find()
        .catch(err => {
          throw new Error(err.message)
        })
        .then((users) => users === [])
    })
});

describe('create a new user', () => {
  it('should return the user doc (object) in the response', async () => {
    let username = 'james',
        password = 'pw';

    // need to wait for this since we rely on using this users info for
    // next test function calls
    await user.create(username, password)
      .then((response) => {
        //
        assert(username === response.username);
        assert(user.username === username);
        // console.log(user.toString());
      })
      .catch(err => {throw new Error(err.message)})
    });
});

/**
 * Create a new game
 * example of response output from call to Game#create
 *
 * { users: [ '5ad3ee2a2f3ed1439ba7b802' ],
 * geolocations: { '5ad3ee2a2f3ed1439ba7b802': { lat: 123, lon: 123 } },
 * _id: '5ad3ee2b2f3ed1439ba7b803',
 * name: 'room1',
 * __v: 0 }
 */
describe('create a new game', () => {
  it('should return the game doc in the response', () => {
    let name = 'room1',
        userId = user.id,
        lat = 123,
        lon = 123;

    game.create(name, userId, lat, lon)
      .catch(err => {throw new Error(err.message)})
      .then(response => {
        assert(response.users[0], 'something is in game.users');
        assert(response.geolocations[userId], `${user.id} is in game.geolocations`);
      })
  })
});

/**
 * Remove all data from db.users and db.games
 */
after(function() {
  UserModel.remove({})
    .catch(err => {throw new Error(err.message)});

  GameModel.remove({})
    .catch(err => {throw new Error(err.message)});
});