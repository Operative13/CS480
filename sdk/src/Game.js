import fetch from 'node-fetch';
import WebSocket from 'ws';

import {
  getDataFromSuccess,
  getErrorFromFailOrError
} from './utility';

module.exports = class Game {
  constructor(baseConnection) {
    this.id = null;
    this.name = null;
    this.users = [];
    this.geolocations = {};
    this.regions = [];

    this._domain = baseConnection.domain;
    this._port = baseConnection.port;
    this._url = `${baseConnection.baseUrl}/api/games`;
  }

  _updateGame(gameDocumentJson) {
    if (gameDocumentJson._id) this.id = gameDocumentJson._id;
    if (gameDocumentJson.name) this.name = gameDocumentJson.name;
    if (gameDocumentJson.users) this.users = gameDocumentJson.users;
    if (gameDocumentJson.geolocations)
      this.geolocations = gameDocumentJson.geolocations;
    if (gameDocumentJson.regions)
      this.regions = gameDocumentJson.regions;
  }

  /**
   * Create a new game lobby / session. The user that creates it is
   * automatically put in it.
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
              if (!response.ok) reject(getErrorFromFailOrError(json));

              let data = getDataFromSuccess(json);
              this._updateGame(data);
              resolve(data);
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
              if (!response.ok) reject(getErrorFromFailOrError(json));

              let data = getDataFromSuccess(json);
              this._updateGame(data);
              resolve(data);
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
              if (!response.ok) reject(getErrorFromFailOrError(json));

              let data = getDataFromSuccess(json);
              this._updateGame(data);
              resolve(data);
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
              if (!response.ok) reject(getErrorFromFailOrError(json));

              let data = getDataFromSuccess(json);
              this._updateGame(data);
              resolve(data);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   *
   * @returns {Promise<any>} resolve contains an object from response body
   *  reject contains an error
   */
  leave(userId, gameId=null) {
    let requestInfo = {
      userId: userId,
    };

    return new Promise((resolve, reject) => {
      fetch(
        `${this._url}/leave/${gameId || this.id}`,
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
              if (!response.ok) reject(getErrorFromFailOrError(json));

              let data = getDataFromSuccess(json);
              this._updateGame(data);
              resolve(data);
            })
            .catch(err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * Creates a websocket to call the given callback when a message is sent
   * from the server. The json from the response will be passed to the callback
   * (without jsend std).
   * @param callback {function} - func should take 1 argument, json from
   *  message from server
   */
  listenForRegionChange(callback) {
    if (!this.id) {
      throw new Error('game id has not been defined within the game object');
    }

    let uri = `ws://${this._domain}:${this._port}/api/games/${this.id}/regions`;
    let socket = new WebSocket(uri);

    socket.onmessage = (msg) => {
      let data = msg.data;
      callback(JSON.parse(data));
    }
  };

  /**
   * Takes puts the attributes associated with the game doc for
   * this game instance and puts them in an object
   * @returns {{id: null|*, name: null|*, users: Array|*, geolocations: {}|*}}
   */
  toJson() {
    return {
      id: this.id,
      name: this.name,
      users: this.users,
      geolocations: this.geolocations,
      regions: this.regions,
    };
  }

  /**
   * Convert this instance to its string representation
   * @returns {string} JSON that holds info of the id, name, users,
   * and geolocations associated with this instance
   */
  toString() {
    return JSON.stringify(
      this.toJson(),
      null,
      2
    );
  }
};