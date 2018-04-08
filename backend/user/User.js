const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const crypto = require('crypto');

// const rfc5322CompliantEmailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
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

    // TODO: could significantly slow down server at least during user creation
    default: `${crypto.randomFillSync(Buffer.alloc(10)).toString('hex')}@fake.email.com`,

    unique: [true, 'Email is not unique within data base'],
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
