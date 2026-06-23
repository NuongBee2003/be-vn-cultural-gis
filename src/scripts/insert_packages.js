require('dotenv').config();
const sequelize = require('../config/connectionDB');

async function run() {
  console.log('Connecting to database to insert subscription packages...');
  try {
    await sequelize.authenticate();
    
    // Check if packages exist
    const [existing] = await sequelize.query("SELECT * FROM packages WHERE name IN ('Plus', 'Premium')");
    
    if (existing.length === 0) {
      console.log('Inserting Plus and Premium packages...');
      await sequelize.query(`
        INSERT INTO packages (name, description, max_places, max_products, price, duration_days, created_at, updated_at)
        VALUES 
        ('Plus', 'Gói Plus hỗ trợ 1 địa điểm và tối đa 20 sản phẩm shop', 1, 20, 99000.00, 30, NOW(3), NOW(3)),
        ('Premium', 'Gói Premium hỗ trợ tối đa 3 địa điểm và 50 sản phẩm shop', 3, 50, 299000.00, 30, NOW(3), NOW(3))
      `);
      console.log('✅ Default packages inserted successfully.');
    } else {
      console.log('ℹ️ Plus and Premium packages already exist.');
    }
  } catch (error) {
    console.error('❌ Insertion failed:', error);
  } finally {
    await sequelize.close();
  }
}

run();
