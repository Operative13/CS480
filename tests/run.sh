# if one these fails, they'll all fail since the server depends on them all
sudo mongod &
redis-server &
mocha testAll.js
