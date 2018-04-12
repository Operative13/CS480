import BaseConnection from './BaseConnection';
import User from './User';

let conn = new BaseConnection('localhost', '3000');
let user = new User(conn);
user.create('james', 'pw')
  .then((response) => console.log(response))
  .catch(err => console.error(err))

user.login('james', 'pw')
  .then((response) => console.log(response))
  .catch(err => console.error(err))