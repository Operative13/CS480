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
   * The amount of time before the next game tick occurs. In game tick:
   * Points awarded to the owner of the capture zone(s).
   * Troops generated in each capture zone(s).
   */
  gameLoopPeriod: 5,

  /**
   * Radius of each circular capture zone
   */
  captureZoneRadius: 11,

  /**
   * The distance between the host init coords and the center of each capture
   * zone.
   */
  captureZoneDistance: 6,

  /**
   * The amount of points awarded for each capture zone owned
   */
  pointsPerCaptureZone: 1,

  /**
   * Once a user in a game obtains this many points, he wins the game
   */
  pointsNeededToWin: 100,

  /**
   * The amount of troops generated and placed inside a capture zone every tick
   */
  troopsPerCaptureZone: 1,

  /**
   * The amount of troops that die trying to take over a base every tick/loop
   */
  troopsAttackingPerCaptureLoop: 1,

  /**
   * Time between troops fighting & dying for ownership of a base.
   */
  troopsAttackingLoopPeriod: 1,

  /**
   * The initial amount of troops given to the player when he joins the game
   */
  initialTroopsForPlayer: 5,

  /**
   * The initial amount of troops spawned when a capture zone is first captured
   * from it's initial neutral state
   */
  initialTroopsForCaptureZone: 1,

  /**
   * After this much time (in seconds) elapses after the game is started,
   * the game ends and a winner is determined.
   */
  gameDuration: 600,
};

module.exports = config;