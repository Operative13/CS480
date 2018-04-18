// MongoDB imports
const mongoose = new require('mongoose');
const mongoDbUri = require('./config').mongoDbUri;
const UserModelImported = new require('../backend/users/User');
const GameModelImported = new require('../backend/games/Game');
// the actual models we're using with proper connection to correct mongoDB URI
var UserModel = null;
var GameModel = null;

const assert = require('assert');
const Promise = require('promise');

// sdk imports
const BaseConnection = require('./lib/BaseConnection');
const User = require('./lib/User');
const Game = require('./lib/Game');
const baseConnection = new BaseConnection('localhost', '3000');
const user = new User(baseConnection);
const user2 = new User(baseConnection);
const user3 = new User(baseConnection);
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
  it('should be equal to empty array', function(done) {
      this.timeout(4000); // in milliseconds
      UserModel.find()
        .catch(err => err)
        .then((users) => {
          assert(users.length === 0);
        })
        .then(() => done(), done);
    })
});

describe('create 2 new users', () => {
  it('each should return user doc in the response', async function() {
    // limited time to finish this test before entire test run ends due to timeout
    this.timeout(4000); // in milliseconds

    // user
    let username = 'james',
        password = 'pw';

    let email = 'john@email.com'; // user2 email

    // need to wait for this since we rely on using this users info for
    // next test function calls
    let p1 = user.create(username, password)
      .then((response) => {
        assert(username === response.username);
        assert(username === user.username);
        // console.log(user.toString());
      })
      .catch(err => err);

    let p2 = user2.create('john', 'pw', email)
      .then(response => {
        // console.log(user2);
        assert(response.email === email);
        assert(user2.email === email);
      })
      .catch(err => err);

    await Promise.all([p1, p2]);
  });
});

describe('db.users', () => {
  it('should contain two users', function(done) {
    // limit it to 2 seconds to finish this test
    this.timeout(2000);
    UserModel.find({}, (err, users) => {
      if (err) return done(err);
      assert(users.length === 2);
      done();
    });
  });
});

describe('try to create a user with a taken username', () => {
  it('should throw an exception in the http response', function(done) {
    // limit it to 2 seconds to finish this test
    this.timeout(2000);

    let username = 'james',
        password = 'pw';

    // need to wait for this since we rely on using this users info for
    // next test function calls
    user3.create(username, password)
      .then((response) => {
        console.log(response);
        assert(username === response.username);
        assert(username === user.username);
        // console.log(user.toString());
        done();
      })
      .catch(err => done());
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
  it('should return the game doc in the response', async () => {
    let name = 'room1',
        userId = user.id,
        lat = 123,
        lon = 123;
    console.log(user);
    await game.create(name, userId, lat, lon)
      .then(response => {
        console.log(response);
        assert(response.users && response.users[0], 'something is in game.users');
        assert(response.geolocations[userId], `${user.id} is in game.geolocations`);
      })
      .catch(err => err)
    console.log(game);
  });
});

describe('have james, a user, leave the game', () => {
  it('should remove james from the game then delete the empty game', function(done) {
    this.timeout(4000);
    console.log(game.toString());
    game.leave(user.id)
      .then(json => {
        console.log(json);
        done();
      })
      .catch(err => {
        done(new Error(err.message));
      })
  });
});

/**
 * Remove all data from db.users and db.games
 */
after(function() {
  UserModel.remove({})
    .catch(err => err);

  GameModel.remove({})
    .catch(err => err);
});