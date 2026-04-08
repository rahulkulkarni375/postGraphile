const userResolver = require("./userResolver");

module.exports = {
  Query: {
    ...userResolver.Query,
  },
};