const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  /**
   * list of Strings which are their _id in User collection
   */
  users: [Schema.Types.ObjectId],

  /**
   * loose schema, stores whatever valid BSON, but by convention:
   * { '123': { lat: 123, lon: 123 }, '456': { lat: 111, lon: 222 } }
   * where the keys are an _id from a User Document
   */
  geolocations: {
    type: Schema.Types.Mixed,
    default: {},
  },

  /**
   * as circular regions or nodes or zones this can look something like
   * [{lon: 123, lat: 123, radius: 44, owner: "123abc", type: "fort"}]
   */
  regions: {
    type: [{type: Schema.Types.Mixed}],
    default: [],
  },

  /**
   * id of the user that has won the game. null implies the game is not over
   */
  winner: {
    type: Schema.Types.ObjectId,
    default: null,
  },

  /**
   * An object with keys being a player id and the value being the score for
   * that player. Example:
   * { '123': 10, '289': 15 }
   */
  scores: {
    type: Schema.Types.Mixed,
    default: {},
  },

  /**
   * The time at which the capture zones were created and became capture-able.
   */
  startTime: {
    type: Date,
    default: null,
  },
});

mongoose.model('Game', GameSchema);
module.exports = mongoose.model('Game');