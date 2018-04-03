/**
 * this file should be filled in with your secret info obtained from
 * mlab.com, mongodb atlas, or similar website that helps you setup your
 * MongoDB on the cloud
 * make copy of this file then rename to config.js
 */
let config = {
  dbUser: 'user',
  dbPassword: 'pw',
  partialMongoDbUri: '123.mlab.com:port11/dbName',

  get mongoDbUri() {
    return `mongodb://${config.dbUser}:${config.dbPassword}@${config.partialMongoDbUri}`
  }
};

module.exports = config;