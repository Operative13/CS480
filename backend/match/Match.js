const mongoose = require('mongoose');  
const MatchSchema = new mongoose.Schema({
  name: String,
  // list of Strings which are their _id in User collection
  players: [String],
  geolocations: [{playerId: String, lat: Number, lon: Number}],
});
mongoose.model('Match', MatchSchema);

module.exports = mongoose.model('Match');