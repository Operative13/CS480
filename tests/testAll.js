const { call } = require('../backend/utility/shell');
const host = call('hostname -I');
const port = 3000;

// cli arg that is read by server.js to define hostname
process.argv.push('--host');
process.argv.push(host);

// load up the server
const server = require('../backend/server');
const assert = require('assert');

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});