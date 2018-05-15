const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // any characters from set [a-zA-Z0-9_] between [1, 100] times
  username: {
    type: String,
    match: /\w{1,100}/,
    required: true,
    unique: true,
  },

  // having a field here be both not required and unique is a bit tricky
  email: {
    type: String,
    // lazy match, anything@anything
    match: /.{1,1000}@.{1,50}/,
    default: '',
  },

  password: {
    type: String,
    // any ASCII characters for a total length of [1, 100]
    match: /[\w\s!"#$%&'()*+,\-.\/:;<=>?@[\\\]\^_`{\|}~\x0b\x0c]{1,1000}/,
    required: true,
  },
});

mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');
