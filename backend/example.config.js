let settings = {
  dbUser: 'user',
  dbPassword: 'pw',
  partialMongoDbUri: '123.mlab.com:port11/dbName',

  mongoDbUri() {
    return `mongodb://${settings.dbUser}:${settings.dbPassword}@${settings.partialMongoDbUri}`
  }
};

module.exports = settings;