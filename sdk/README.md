# CS480/sdk

npm package name: kingdoms-game-sdk

Standard Development Kit / REST API Wrapper

This is the JS library that provides classes and methods to help access
the REST API defined in the backend of our game, kingdoms-game.

## Install

`npm i kingdoms-game-sdk --save`

## Usage

```
import BaseConnection from 'kingdoms-game-sdk/BaseConnection';
import User from 'kingdoms-game-sdk/User';

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

Write some test files to use files generated and saved to lib/ folder by
`npm run build`
