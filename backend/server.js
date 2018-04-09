const program = require('commander');
const { app } = require('./app');
var port = process.env.PORT || 3000;
var hostname = process.env.HOST || 'localhost';
// to make public, you need to do port forwarding in your network router
// settings and you should be hosting on $(hostname -I)
// $ hostname -I # this should be your IP within your network

program
  .version('0.0.0')
  .option('-h', '--host', '--hostname')
  .option('-p', '--port')
  .option('--mongodb-uri')
  .parse(process.argv);

const db = require('./db');
db.connectToDb(program.mongodbUri);

const server = app.listen(program.port || port, program.hostname || hostname, function() {
  console.log(`Express nodejs server available at: http://${hostname}:${port}`);
});