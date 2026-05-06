const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(
  "traveldb",
  "root",
  "",
  {
    dialect: "mysql",
    logging: false,
  }
);
const testConnetion = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
testConnetion()
module.exports = sequelize;