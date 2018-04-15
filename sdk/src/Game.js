import fetch from 'node-fetch';

module.exports = class Game {
  constructor(baseConnection) {
    this.id = null;
    this.name = null;
    this.players = [];
    this.geolocations = {};

    this._url = `${baseConnection.baseUrl}/api/games`;
  }

  _updateGame(gameDocumentJson) {
    if (gameDocumentJson.id) this.id = gameDocumentJson._id;
    if (gameDocumentJson.name) this.name = gameDocumentJson.name;
    if (gameDocumentJson.players) this.players = gameDocumentJson.players;
    if (gameDocumentJson.geolocations) this.geolocations = gameDocumentJson.geolocations;
  }

  /**
   * Create a new game lobby / session
   * @param name - game name
   * @param userId - id of user who is creating the game
   * @param lat - initial latitude of player
   * @param lon - initial longitude of player
   * @param joinIfExists - if the game name already exists, try to join it
   * @returns {Promise<any>} resolve contains an object from response body
   *  reject contains an error
   */
  create(name, userId, lat, lon, joinIfExists=false) {
    let requestInfo = {
      name: name,
      myUserId: userId,
      lat: lat,
      lon: lon,
      joinIfExists: joinIfExists
    };

    return new Promise((resolve, reject) => {
      fetch(
        this._url + '/create',
        {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestInfo),
        })
        .then((response) => {
          response.json()
            .then((json) => {
              this._updateGame(json);
              resolve(json);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })

  }

  /**
   * Join a game lobby / session
   * @param myUserId
   * @param gameName
   * @param usernameToJoin
   * @returns {Promise<any>} resolve contains an object from response body
   *  reject contains an error
   */
  join(myUserId, gameName, usernameToJoin) {
    let requestInfo = {
      myUserId: myUserId,
      gameName: gameName,
      username: usernameToJoin,
    };

    return new Promise((resolve, reject) => {
      fetch(
        this._url + '/join',
        {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestInfo),
        })
        .then((response) => {
          response.json()
            .then((json) => {
              this._updateGame(json);
              resolve(json);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Set / update the latitude and longitude of a player in
   * this game
   * @param userId
   * @param lon
   * @param lat
   * @returns {Promise<any>} resolve contains an object from response body
   *  reject contains an error
   */
  setGeolocation(userId, lon, lat) {
    let requestInfo = {
      myUserId: userId,
      lon: lon,
      lat: lat,
    };

    return new Promise((resolve, reject) => {
      fetch(
        `${this._url}/${this.id}`,
        {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestInfo),
        })
        .then((response) => {
          response.json()
            .then((json) => {
              this._updateGame(json);
              resolve(json);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Get the all info of a game given a gameId. Defaults to using this.id
   * for the gameId if none is given
   * @param {string} gameId
   * @returns {Promise<any>} resolve contains an object from response body
   *  reject contains an error
   */
  getGame(gameId) {
    if (!gameId) gameId = this.id;

    return new Promise((resolve, reject) => {
      fetch(
        `${this._url}/${gameId}`,
        {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
        })
        .then((response) => {
          response.json()
            .then((json) => {
              this._updateGame(json);
              resolve(json);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Convert this instance to its string representation
   * @returns {string} JSON that holds info of the id, name, players,
   * and geolocations associated with this instance
   */
  toString() {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      players: this.players,
      geolocations: this.geolocations
    },
      null,
      2
    );
  }
}