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
const userJames = new User(baseConnection);
const userJohn = new User(baseConnection);
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


/**
 * Remove all data from db.users and db.games
 */
before(function() {
  UserModel.remove({})
    .catch(err => err);

  GameModel.remove({})
    .catch(err => err);
});

/**
 * TODO: Use User#getUsers to confirm this a 2nd time
 */
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

describe('User#create: create 2 new users', () => {
  it('each should return user doc in the response', async function() {
    // limited time to finish this test before entire test run ends due to timeout
    this.timeout(4000); // in milliseconds

    // user
    let username = 'james',
        password = 'pw';

    let email = 'john@email.com'; // user2 email

    // need to wait for this since we rely on using this users info for
    // next test function calls
    let p1 = userJames.create(username, password)
      .then((response) => {
        assert(username === response.username);
        assert(username === userJames.username);
        // console.log(user.toString());
      })
      .catch(err => err);

    let p2 = userJohn.create('john', 'pw', email)
      .then(response => {
        // console.log(user2);
        assert(response.email === email);
        assert(userJohn.email === email);
      })
      .catch(err => err);

    await Promise.all([p1, p2]);
  });
});

describe('User#login: have james login successfully', () => {
  it('should return the user doc associated with james', function() {
    return (new User(baseConnection)).login(userJames.username, 'pw')
      .then(json => {
        assert(json._id === userJames.id);
      })
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

describe('User#create: try to create a user with a taken username', () => {
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
        assert(username === userJames.username);
        done();
      })
      // TODO: use expect function from chai to assert exception is thrown
      .catch(err => done())
      // .catch(err => done(new Error(err.message)));
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
describe('Game#create: create a new game', () => {
  it('should return the game doc in the response', async () => {
    let name = 'room1',
        userId = userJames.id,
        lat = 123,
        lon = 123;
    await game.create(name, userId, lat, lon)
      .then(response => {
        assert(response.users && response.users[0], 'something is in game.users');
        assert(response.geolocations[userId], `${userJames.id} is in game.geolocations`);
      })
      .catch(err => err);
  });
});

describe('Game#listenForRegionChange: adds a callback to call when region info changed', () => {
  it('should call the callback before all the test cases finish', () => {
    let callback = () => {
      console.log('callback called');
    };

    game.listenForRegionChange(callback);
  });
});

describe('Game#setGeolocation: set james\'s geolocation to 10, 50 (lon, lat)', () => {
  it('should change the info stored in the game doc', function(done) {
    game.setGeolocation(userJames.id, 10, 50)
      .then(json => {
        assert(json.geolocations[userJames.id].lon === 10);
        assert(json.geolocations[userJames.id].lat === 50);
        done();
      })
      .catch(err => done(new Error(err.message || err.data)));
  })
});

describe('Game#join: have john join the game james is in', () => {
  it('should put john in the game', async () => {
    await game.join(userJohn.id, null, userJames.username)
      .then(json => {
        // console.log(json);
        assert(json.users.length === 2, 'users contains two users');
        assert(Object.keys(json.geolocations).length === 2);
      })
      .catch(err => {throw new Error(err['message'] || err.data)})
  })
});

describe('john joins the game directly on top of a capture region', () => {
  it('should change that region owner to john\'s id', function() {
    let lat = game.regions[0].lat;
    let lon = game.regions[0].lon;

    return game.setGeolocation(userJohn.id, lon, lat)
      .then(json => {
        // console.log(json);
        console.log(game.toString());
        assert(json.regions[0].owner === userJohn.id);
      })
      .catch(err => {
        throw new Error(err.message || err.data);
        // done(new Error(err.message || err.data))
      });
  });
});

describe('Game#leave: have each user leave the game', () => {
  it('should remove james & john from the game then delete the empty game', () => {
    return game.leave(userJames.id)
      .then(json => {
        assert(json.users.length === 1);
        game.leave(userJohn.id)
          .then(json => {
            assert(json.users.length === 0);
          })
          .catch(err => {
            throw new Error(err.message);
          })
      })
      .catch(err => {
        throw new Error(err.message);
      })
  });
});
