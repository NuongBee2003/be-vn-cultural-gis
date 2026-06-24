require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  try {
    await sequelize.authenticate();
    const [users] = await sequelize.query("SELECT id, username, email, role FROM users WHERE username LIKE '%Huỳnh Tấn Đạt%' OR username LIKE '%Đạt%'");
    console.log("Dat User in DB:", users);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
