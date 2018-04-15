// MongoDB imports
const mongoose = new require('mongoose');
const mongoDbUri = require('./config').mongoDbUri;
const UserModelImported = new require('../backend/users/User');
// the actual model we're using with proper connection to correct mongoDB URI
var UserModel = null;

const assert = require('assert');

// sdk imports
const BaseConnection = require('./lib/BaseConnection');
const User = require('./lib/User');
const baseConnection = new BaseConnection('localhost', '3000');
const user = new User(baseConnection);

/**
 * Connect to the proper mongoDB URI
 */
before(function() {
  let conn = mongoose.createConnection(mongoDbUri);
  UserModel = conn.model('User', UserModelImported.schema);
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
  it('should return the user doc (object) in the response', () => {
    let username = 'james',
        password = 'pw';

    user.create(username, password)
      .then((response) => {
        //
        assert(username === response.username);
        assert(user.username === username);
      })
      .catch(err => {throw new Error(err.message)})
      });
});

/**
 * Remove all users from db
 */
after(function() {
  // wait for db.users contents to be removed
  UserModel.remove({})
    .catch(err => {throw new Error(err.message)})
    // .then(response => console.log('UserModel.remove({})', response))
    // .catch(err => console.err(err));
});