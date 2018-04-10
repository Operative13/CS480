const program = require('commander');
const { app } = require('./app');

// to make public, you need to do port forwarding in your network router
// settings and you should be hosting on $(hostname -I)
// $ hostname -I # this should be your IP within your network

let trim = (value) => value.trim();

program
  .version('0.0.0')
  .option('-h, --host <host>', trim)
  .option('-p, --port <port>', trim)
  .option('-u, --mongodb-uri <uri>', trim)
  .parse(process.argv);

const db = require('./db');
db.connectToDb(program.mongodbUri);

const port = process.env.PORT || program.port || 3000;
const hostname = process.env.HOST || program.host || 'localhost';

const server = app.listen(port, hostname, function() {
  console.log(`Express nodejs server available at: http://${hostname}:${port}`);
});

// module.exports = { program, server };
module.exports = { hostname, port, server };