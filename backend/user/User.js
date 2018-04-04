const mongoose = require('mongoose');

const rfc5322CompliantEmailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const UserSchema = new mongoose.Schema({
  // any characters from set [a-zA-Z0-9_] between [1, 100] times
  username: { type: String, match: /\w{1,100}/ },

  // string verified to represent an email by RFC 5322 regex
  email: { type: String, match: rfc5322CompliantEmailRegex },

  // any characters for a total length of [1, 100]
  password: { type: String, match: /.{1, 100}/ },
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');