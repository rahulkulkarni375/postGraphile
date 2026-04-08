const { User, sequelize } = require("../models");

// ✅ Sequelize ORM (recommended)
const getAllUsers = async () => {
  return User.findAll({
    attributes: ["id", "email"],
    limit: 100,
    raw: true,
  });
};

// ✅ Raw SQL (for performance-critical queries)
const getUsersRaw = async () => {
  return sequelize.query(
    "SELECT * FROM users LIMIT 100",
    {
      type: sequelize.QueryTypes.SELECT,
    }
  );
};

module.exports = { getAllUsers,getUsersRaw };