# use babel to transform es6 lib to node compatible lib
npm run build

server_path="../backend/server.js"

# run our server, kingdoms-game-backend
# node $server_path --host localhost --port 3000 --mongodb-uri mongodb://localhost:27017
node $server_path --host localhost --port 3000 --mongodb-uri mongodb://localhost
