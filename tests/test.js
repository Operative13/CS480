const { call } = require('../backend/utility/shell');
const port = '3000';

call('hostname -I').then((host) => {
  console.log(host);
  // cli arg that is read by server.js to define hostname
  // process.argv.push(`--host ${host.trim()}`);
  process.argv.push(`--host`);
  process.argv.push(host.trim());
  console.log(process.argv);

  // load up the server
  const server = require('../backend/server');
});

const assert = require('assert');


function test() {
  describe('Array', function() {
    describe('#indexOf()', function() {
      it('should return -1 when the value is not present', function() {
          assert.equal([1,2,3].indexOf(4), -1);
        });
      });
  });
}

const mongoose = require('mongoose');
const User = require('../backend/users/User');

function test2() {
  let users = [
    {username: 'james', password: 'pw', email: 'james@email.com'},
  ];
  User.insert(users).then((err, insertedUsers) => {
    describe('User collection', function() {
      describe('follows its schema', function() {
        it('should be equal to users local variable', function() {
            assert(true);
          });
        });
    });
  });

}