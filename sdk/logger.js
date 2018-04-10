const winston = require('winston');

const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: 'sdk.log' })
    ]
  });

module.exports = logger;