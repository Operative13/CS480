# CS480/backend

Nodejs and express app that serves as our REST API

## Requires

[nodejs](https://nodejs.org/en/)

## Install
 
```
$ git clone git@github.com:Operative13/CS480.git
$ cd CS480/backend
$ npm i
```

You need to copy `example.config.js` to `config.js` and fill out config info
for connecting to your MongoDB URI. Ask James, @jtara1, for the team's config
or create your own at mlab.com or where ever.

## Run

From backend directory

```
$ npm start
```

you might need to `npm i nodemon`

Alternatively, just use `node` instead of `nodemon` (with `node server.js`)
to run the server 
(`npm start` will invoke the script at the location specified in package.json) 


## Dev Tools

| Program | Purpose |
| --- | --- |
| Webstorm | IDE |
| Postman | Creates HTTP requests & allows for changes in request body or header |
| mongo-shell | Interact with MongoDB directly |

Note: mlab.com requires mongo v3.0 or higher (Debian repos outdated as always)

Note2: mongo-server (`mongod`) needs to be running before you can use 
`mongo` (mongo-shell or mongo-client at least).

---

boilerplate code for RESTful API for users originated from:
https://hackernoon.com/restful-api-design-with-node-js-26ccf66eab09#.s5l66zyeu
