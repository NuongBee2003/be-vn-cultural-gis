require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  try {
    await sequelize.authenticate();
    
    // Demote role to 'user'
    await sequelize.query("UPDATE users SET role = 'user', business_name = NULL, business_phone = NULL WHERE email = 'datmino93737@gmail.com'");
    
    // Delete any active subscriptions to start fresh
    await sequelize.query("DELETE FROM user_subscriptions WHERE user_id = 19");
    
    console.log("Successfully demoted datmino93737@gmail.com (ID 19) to role 'user' and deleted active subscriptions.");
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}
run();
