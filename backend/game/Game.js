const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  // list of Strings which are their _id in User collection
  users: [Schema.Types.ObjectId],

  // extremely loose schema, stores whatever valid BSON, but by convention:
  // { '123': { lat: 123, lon: 123 }, '456': { lat: 111, lon: 222 } }
  // where the keys are an _id from a Document from User
  geolocations: {
    type: Schema.Types.Mixed,
    default: {},
  },
});

mongoose.model('Game', GameSchema);
module.exports = mongoose.model('Game');