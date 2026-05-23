const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: "mysql",
    host: process.env.DATABASE_HOST || "localhost",
    port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
    timezone: '+07:00',
    pool: {
      afterCreate: (connection, callback) => {
        connection.query("SET time_zone = '+07:00'", (error) => {
          callback(error, connection);
        });
      },
    },
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