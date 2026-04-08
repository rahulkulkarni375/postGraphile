const sequelize = require("../db/connection");
const User = require("./user.model");

const db = { sequelize,User };

module.exports = db;