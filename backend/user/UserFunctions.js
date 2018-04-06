const ObjectId = require('mongoose').Types.ObjectId;
const User = new require('./User.js');

// module.exports = {getUser, getUsername, getUserId, isUser};
module.exports = {
  async getUser(userId) {
    return await User.findOne({_id: new ObjectId(userId)}).exec();
  },

  getUsername(userId) {
    return getUser(userId).username;
  },

  getUserId(username) {
    User.findOne({username: username}, (err, user) => {
      if (err) throw err;
      if (user) return user._id;
    });
  },

  /**
   * @param {String} userId
   * @returns {boolean} true if there exists a user of that userId
   */
  isUser(userId) {
    // treats user Document as truthy value
    return !!getUser(userId);
  },
};