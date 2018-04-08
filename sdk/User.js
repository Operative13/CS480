const fetch = require('node-fetch');

// TODO: sdk, frontend, and backend shouldn't have dependent imports like this
const UserModel = new require('../backend/user/User');

class User {
  constructor(baseConnection) {
    // non-private attributes directly describe the User from Document
    this.id = null;
    this.username = null;

    this._url = `${baseConnection.baseUrl}/api/users`;
  }

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

  async create(username, password, email) {
    let userInfo = {username: username, password: password};
    if (email) userInfo['email'] = email;
    console.log(userInfo);
    let user = new UserModel(userInfo);

    return user.validate()
      .then((user) => {
        let promise = fetch(
          this._url + '/register',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userInfo),
          }
        );
        promise.then((response) => response.json());
        promise.catch((err) => err);
      })
      .catch((err) => err);
  }
  // register = User.create.bind(this);

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
        this.username = response.body.username;
        this.email = response.body.email;
        return response;
      })
      .catch((err) => err);
  }

  toString() {
    // pretty printed JSON representation of this instance
    return JSON.stringify({
        id: this.id,
        username: this.username,
      },
      null,
      2
    );
  }
}

module.exports = User;