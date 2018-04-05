const app = require('./app');
var port = process.env.PORT || 3000;
var hostname = process.env.HOST || 'localhost';
// to make public, you need to do port forwarding in your network router
// settings and you should be hosting on $(hostname -I)
// $ hostname -I # this should be your IP within your network

// quick command line interface argument parsing
for (let i = 2; i < process.argv.length; i++) {
  if ('--host' === process.argv[i]) {
    hostname = process.argv[i + 1];
  } else if ('--port' === process.argv[i]) {
    port = process.argv[i + 1];
  }
}

const server = app.listen(port, hostname, function() {
  console.log(`Express nodejs server available at: http://${hostname}:${port}`);
});