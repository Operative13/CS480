const ObjectId = require('mongoose').Types.ObjectId;
const User = new require('./User.js');

/**
 * @param userId
 * @returns {Promise<any>} Resolution value is null if no user is found.
 *  Otherwise, it's BSON / JSON
 */
async function getUser(userId) {
  return await User.findOne({_id: new ObjectId(userId)}).exec()
    .catch(err => console.error(err));
}

async function getUserByUsername(username) {
  return await User.findOne({username: username}).exec()
    .catch(err => console.error(err));
}

function getUsername(userId) {
  return getUser(userId).username;
}

async function getUserId(username) {
  let user = await getUserByUsername(username).catch((err) => {
    throw new Error(err);
  });
  return user._id;
}

/**
 * @param {String} userId
 * @returns {Promise<boolean>} true if there exists a users of that userId
 */
async function isUser(userId) {
  let user = await getUser(userId);
  return !!user;
}

module.exports = {getUser, getUsername, getUserId, isUser};