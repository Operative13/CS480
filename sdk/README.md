# CS480/sdk

npm package name: kingdoms-game-sdk

Standard Development Kit / REST API Wrapper

This is the JS library that provides classes and methods to help access
the REST API defined in the backend of our game, kingdoms-game.

## Install

`npm i kingdoms-game-sdk --save`

## Usage

```
import BaseConnection from 'kingdoms-game-sdk/src/BaseConnection';
import User from 'kingdoms-game-sdk/src/User';

let conn = new BaseConnection('localhost', '3000');
let user = new User(conn);
user.create('usernamer123', 'password')
    .then((response) => console.log(response))
    .catch((error) => console.error(error));
```

Do note that the methods that call the REST API from all of the classes 
are async and return a Promise that whose resolve should contain the JSON
from the http response body. 


## Tests

It's best to have the entire repo locally on your pc so `git clone` this
and `cd CS480/sdk`

To run the tests:

1. `npm run build` to use babel to transform from es6 to nodejs for 
compatibility
2. `nodemon ../backend/server.js --host localhost --mongodb-uri mongodb://localhost &`
to run the server
3. `npm test` to run the tests

I have a db hosted on mlab.com for our testing called cs480-tests.
Steps 1-2 can be done by running `setup_server.sh` which is derived from 
`example.setup_servers.sh`. See the google shared folder I sent out which 
contains all the configs I'm using for easier setup here.
