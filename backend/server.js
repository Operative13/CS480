var app = require('./app');
var port = process.env.PORT || 3000;
const hostname = process.env.HOST || 'localhost';

var server = app.listen(port, hostname, function() {
  console.log(`Express nodejs server available at: http://${hostname}:${port}`);
});