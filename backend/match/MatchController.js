const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
const Match = new require('./Match');

/**
 * Send all matches
 */
router.get('/', function(req, res) {
  Match.find({}, function(err, matches) {
    res.status(200).send(matches);
  })
});

/**
 * Create a new match
 * Needs: myPlayerId, name (of match), lat, lon
 * defined in request body
 */
router.post('/', function (req, res) {
  let info = {
    playerId: req.body.myPlayerId,
    lat: req.body.lat,
    lon: req.body.lon
  };

  Match.create({
      name: req.body.name,
      players: [req.body.myPlayerId],
      geolocations: [info],
    }, (err, match) => {
      if (err) return res.status(500).send(err);
      return res.status(200).send(`created\n${match}`);
  });
});

/**
 * Get info on a specific match
 * E.g.: http://localhost:3000/api/match/5ac3fe68a79c5f523e8df030
 */
router.get('/:id', function(req, res) {
  Match.findById(req.params.id, function (err, match) {
    if (err) return res.status(500).send("There was a problem finding the match.");
    if (!match) return res.status(404).send("No match found.");
    res.status(200).send(match);
  });
});

/**
 * Update match info
 * Needs: id (User _id: ObjectId), myPlayerId, lat, lon
 * in request body
 */
router.post('/:id', function(req, res) {
  Match.find({_id: req.params.id}, function(err, match) {
    // TODO: fix this later, better query
    for (let i = 0; i < match.geolocations.length; i++) {
      if (match.geolocations[i].playerId === req.body.myPlayerId) {
        match.geolocations[req.body.myPlayerId] = {
          lat: req.body.lat,
          lon: req.body.lon,
        };
        match.save();
        return res.status(200).send(match);
      }
    }
  });
});

module.exports = router;