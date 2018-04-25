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

  // loose schema, stores whatever valid BSON, but by convention:
  // { '123': { lat: 123, lon: 123 }, '456': { lat: 111, lon: 222 } }
  // where the keys are an _id from a User Document
  geolocations: {
    type: Schema.Types.Mixed,
    default: {},
  },

  // as circular regions or nodes or zones this can look something like
  // [{lon: 123, lat: 123, radius: {deltaLon: 0.00005, deltaLat: 0.000045}]
  regions: {
    type: [{type: Schema.Types.Mixed}],
    default: [],
  }
});

mongoose.model('Game', GameSchema);
module.exports = mongoose.model('Game');