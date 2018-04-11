const BaseConnection = require('./BaseConnection');
const User = require('./User');

let baseConn = new BaseConnection('192.168.254.10', '3000');
let u = new User(baseConn);

console.log(u._url);

let promise = u.getUsers();
promise.then((val) => console.log(val)).catch((err) => console.error(err));

let promise2 = u.create('rob2', 'pw', 'rob2@e.com');
promise2.then((val) => console.log(val)).catch((err) => console.error(err));
u.create('james12', 'pw', 'jdsjfj@e.com')
  .then((val) => console.log(k))
  .catch(err => console.error(err));

let promise3 = u.login('james', 'pw');
promise3.then((val) => console.log(val)).catch((err) => console.error(err));