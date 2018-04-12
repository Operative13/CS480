const { call } = require('../backend/utility/shell');
const port = '3000';
const UserModel = new require('../backend/users/User');
const BaseConnection = require('../sdk/BaseConnection');
const UserSdk = require('../sdk/User');
const assert = require('assert');

//call('hostname -I').then((host) => {
call('echo starting').then((stdout) => {
  // cli arg that is read by server.js to define hostname and port
  //host = host.trim();
  let host = 'localhost';
  process.argv.push(`--host`);
  process.argv.push(host);
  process.argv.push('--mongodb-uri');
  process.argv.push(`mongodb://${host}:27017`);

  // load up the server
  const { hostname, port, server } = require('../backend/server');

  function testUserSdk() {
    let conn = new BaseConnection(host, port);
    let amy = new UserSdk(conn);
    let username = 'amy123',
        password = 'pw',
        email = 'amy123@e.com';

    amy.create(username, password, email)
      .then((user) => {
        assert(amy.username === username &&
          amy.email === email);
      })
      .catch((err) => console.error(err));
  }

  teardown();
  test();
  testUserSdk();
});

function test() {
  describe('Array', function() {
    describe('#indexOf()', function() {
      it('should return -1 when the value is not present', function() {
          assert.equal([1,2,3].indexOf(4), -1);
        });
      });
  });
}

/**
 * Please, do not call this while mongoose is connected to a remote URI.
 * TODO: verify this isn't our shared mongoDB URI which holds all the actual
 * TODO: info for the game (make sure it's not production connection)
 */
function teardown() {
  // removes all documents from db.users collection
  UserModel.remove({})
    .then(response => console.log('UserModel.remove({})', response))
    .catch(err => console.err(err));
}

