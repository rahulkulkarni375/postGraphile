const userService = require("../../services/userService");

const Query = {
  getAllUsersList: async () => { return userService.getUsersRaw();
  },
};

module.exports = { Query };