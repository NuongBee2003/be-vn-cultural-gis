const { Sequelize } = require("sequelize");
const mysql2 = require('mysql2');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: "mysql",
    dialectModule: mysql2,
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
module.exports = sequelize;