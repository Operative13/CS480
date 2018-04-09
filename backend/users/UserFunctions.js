const ObjectId = require('mongoose').Types.ObjectId;
const User = new require('./User.js');

// module.exports = {getUser, getUsername, getUserId, isUser};

async function getUser(userId) {
  return await User.findOne({_id: new ObjectId(userId)}).exec();
}

async function getUserByUsername(username) {
  return await User.findOne({username: username}).exec();
}

function getUsername(userId) {
  return getUser(userId).username;
}

async function getUserId(username) {
  return (await getUserByUsername(username))._id;
}

/**
 * @param {String} userId
 * @returns {boolean} true if there exists a users of that userId
 */
function isUser(userId) {
  // treats users Document as truthy value (converts it to boolean)
  return !!getUser(userId);
}

module.exports = {getUser, getUsername, getUserId, isUser};