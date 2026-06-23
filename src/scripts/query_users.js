require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query("SELECT id, username, email, role FROM users LIMIT 5");
    console.log("Users in DB:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
