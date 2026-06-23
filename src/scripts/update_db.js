require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  console.log('Connecting to database...');
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // 1. Add max_products to packages
    console.log('Adding max_products column to packages if it does not exist...');
    try {
      await sequelize.query(`
        ALTER TABLE packages ADD COLUMN max_products INT DEFAULT 3 AFTER max_places;
      `);
      console.log('✅ Added max_products column successfully.');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('ℹ️ max_products column already exists.');
      } else {
        console.error('❌ Error adding max_products:', err.message);
      }
    }

    // 2. Update status enum in user_subscriptions
    console.log('Updating user_subscriptions status ENUM column...');
    try {
      await sequelize.query(`
        ALTER TABLE user_subscriptions MODIFY COLUMN status ENUM('pending', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'active';
      `);
      console.log('✅ Updated user_subscriptions status ENUM successfully.');
    } catch (err) {
      console.error('❌ Error modifying user_subscriptions status enum:', err.message);
    }

    // 3. Create products table
    console.log('Creating products table...');
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          image_url VARCHAR(255) NULL,
          affiliate_url VARCHAR(255) NULL,
          user_id INT NOT NULL,
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ Created products table successfully.');
    } catch (err) {
      console.error('❌ Error creating products table:', err.message);
    }

    // 4. Update existing package limits:
    console.log('Checking and setting package limits...');
    try {
      const [pkgs] = await sequelize.query("SELECT * FROM packages");
      console.log('Existing packages in database:', pkgs);

      for (const p of pkgs) {
        if (p.price == 0) {
          await sequelize.query(`UPDATE packages SET max_places = 0, max_products = 3 WHERE id = ${p.id}`);
          console.log(`Updated free package ${p.name} (id: ${p.id}) limits to 0 places, 3 products`);
        } else if (p.price > 0 && p.price < 200000) {
          await sequelize.query(`UPDATE packages SET max_places = 1, max_products = 20 WHERE id = ${p.id}`);
          console.log(`Updated plus package ${p.name} (id: ${p.id}) limits to 1 places, 20 products`);
        } else if (p.price >= 200000) {
          await sequelize.query(`UPDATE packages SET max_places = 3, max_products = 50 WHERE id = ${p.id}`);
          console.log(`Updated premium package ${p.name} (id: ${p.id}) limits to 3 places, 50 products`);
        }
      }
    } catch (err) {
      console.error('❌ Error setting package limits:', err.message);
    }

  } catch (error) {
    console.error('Database query failed:', error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

run();
