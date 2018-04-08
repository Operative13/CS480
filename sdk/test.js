const BaseConnection = require('./BaseConnection');
const User = require('./User');

let baseConn = new BaseConnection('192.168.254.10', '3000');
let u = new User(baseConn);

console.log(u._url);
console.log(u.toString());

// let promise = u.getUsers();
// console.log(promise);
// promise.then((val) => console.log(val)).catch((err) => console.error(err));

let promise2 = u.create('myuser1231222', 'pw');
promise2.then((val) => console.log(val)).catch((err) => console.error(err));

// let promise3 = u.login('james', 'pw');
// promise3.then((val) => console.log(val)).catch((err) => console.error(err));