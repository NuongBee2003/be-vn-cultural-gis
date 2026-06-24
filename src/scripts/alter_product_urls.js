require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  console.log('Connecting to database...');
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    console.log('Altering products table columns image_url and affiliate_url to TEXT...');
    await sequelize.query(`
      ALTER TABLE products 
      MODIFY COLUMN image_url TEXT NULL,
      MODIFY COLUMN affiliate_url TEXT NULL;
    `);
    console.log('✅ Altered products table successfully.');

  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

run();
