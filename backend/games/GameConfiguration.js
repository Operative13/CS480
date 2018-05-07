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

  /**
   * The amount of points awarded for each capture zone owned
   */
  pointsPerCaptureZone: 1,

  /**
   * Once a user in a game obtains this many points, he wins the game
   */
  pointsNeededToWin: 100,

  /**
   * After this much time (in seconds) elapses after the game is started,
   * the game ends and a winner is determined.
   */
  gameDuration: 600,
};

module.exports = config;