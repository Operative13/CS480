import fetch from 'node-fetch';

/**
 * Represents a single users and allows for access to backend REST API
 * UserController where /api/users routes are defined
 */
export default class User {

  /**
   * @param {BaseConnection} baseConnection
   */
  constructor(baseConnection) {
    // non-private attributes directly describe the User from Document
    this.id = null;
    this.username = null;
    this.email = null;

    this._url = `${baseConnection.baseUrl}/api/users`;
  }

  _updateUser(id, username, email) {
    if (id) this.id = id;
    if (username) this.username = username;
    if (email) this.email = email;
  }

  /**
   * Gets the list of all users
   * @returns {Promise<*>} resolves to an Array of Objects containing info on
   *  users
   */
  async getUsers() {
    return fetch(
      this._url,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      },
    )
      .then((response) => response.json())
      .catch((err) => err);
  }

  /**
   * Creates (registers) a new users given a unique username and password.
   * email is optional
   * @param username
   * @param password
   * @param email
   * @returns {Promise<*>}
   */
  async create(username, password, email) {
    let userInfo = {username: username, password: password};
    if (email) userInfo['email'] = email;

    return new Promise((resolve, reject) => {
      fetch(
        this._url + '/register',
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userInfo),
        })
        .then((response) => {
          response.json()
            .then((json) => {
              this._updateUser(json._id, json.username, json.email);
              console.info(`created new user:\n${this.toString()}`);
              resolve(json);
            })
            .catch(err => {console.error(err); reject(err)});
        })
        .catch((err) => {console.error(err); reject(err.json())});
    });
  }

  /**
   * @alias create
   * @param username
   * @param password
   * @param email
   * @returns {Promise<*>}
   */
  async register(username, password, email) {
    return this.create(username, password, email);
  }

  /**
   * Login given a username and password. Updates username, id, & email for
   * this users
   * @param {String} username
   * @param {String} password - not hashed
   * @returns {Promise<*>} on resolve, passes Object from response.body
   */
  async login(username, password) {
    let userInfo = {username: username, password: password};

    return fetch(
      this._url + '/login',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo),
      }
    )
      .then((response) => {
        this._updateUser(response._id, response.username, response.email);
        return response.json();
      })
      .catch((err) => err);
  }

  toString() {
    // pretty printed JSON representation of this instance
    return JSON.stringify({
        id: this.id,
        username: this.username,
        email: this.email,
      },
      null,
      2
    );
  }
}
