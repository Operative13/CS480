const config = {
  /**
   * limit on number of users per games session
   */
  maxUsers: 2,
  regionTypes: {
    castle: "castle",
    fort: "fort",
  },

  /**
   * Points awarded to the owner of the capture zone(s) every x seconds
   * where x is this value.
   */
  captureZonePointsAwardedPeriod: 5,
};

module.exports = config;