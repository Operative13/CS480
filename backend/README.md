# CS480/backend

Nodejs and express app that serves as our REST API

## Requires

- [nodejs](https://nodejs.org/en/)

## Install
  
```
git clone git@github.com:Operative13/CS480.git
cd CS480/backend
npm i
```

You need to copy `example.config.js` to `config.js` and fill out config info
for connecting to your MongoDB URI. Ask James, @jtara1, for the team's config
or create your own at mlab.com or where ever.

## Run

From backend directory

```
npm start
``` 

## Dev Tools

| Program | Purpose |
| --- | --- |
| Webstorm | IDE |
| Postman | Creates HTTP requests & allows for changes in request body or header |
| mongo-shell | Interact with MongoDB directly |

Note: mlab.com requires mongo v3.0 or higher (Debian repos outdated as always)

Note2: mongo-server (`mongod`) might need to run in parallel before you can use 
`mongo` (mongo-shell or mongo-client at least). See
https://github.com/Operative13/CS480/wiki/How-to-Install-MongoDB for help on 
installing mongodb
