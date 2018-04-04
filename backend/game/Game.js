const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  // list of Strings which are their _id in User collection
  players: [Schema.Types.ObjectId],

  geolocations: [
    {
      playerId: Schema.Types.ObjectId,
      // latitude
      lat: Number,
      // longitude
      lon: Number
    }
  ],
});
mongoose.model('Game', GameSchema);

module.exports = mongoose.model('Game');