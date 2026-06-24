require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  try {
    await sequelize.authenticate();
    const [pkgs] = await sequelize.query("SELECT id, name, duration_days, price FROM packages");
    console.log("Packages in DB:", pkgs);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
