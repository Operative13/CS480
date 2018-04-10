const { call } = require('../backend/utility/shell');
const port = '3000';
const UserModel = new require('../backend/users/User');
const BaseConnection = require('../sdk/BaseConnection');
const UserSdk = require('../sdk/User');
const assert = require('assert');

call('hostname -I').then((host) => {
  // cli arg that is read by server.js to define hostname and port
  host = host.trim();
  process.argv.push(`--host`);
  process.argv.push(host);
  process.argv.push('--mongodb-uri');
  process.argv.push(`mongodb://${host}:27017`);

  // load up the server
  const { hostname, port, server } = require('../backend/server');

  function testUserSdk() {
    let conn = new BaseConnection(host, port);
    let amy = new UserSdk(conn);
    amy.create('amy123', 'pw', 'amy123@e.com')
      .then(() => console.log(amy.toString()))
      .catch((err) => console.error(err)) ;
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

function teardown() {
  // removes all documents from db.users collection
  UserModel.remove({});
}

