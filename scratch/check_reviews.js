const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('../src/models');

async function checkReviews() {
  try {
    const locations = await db.Location.findAll({
      where: { place_id: 49 },
      attributes: ['id', 'address']
    });
    console.log("LOCATIONS FOR PLACE 49:");
    const locIds = locations.map(l => {
      console.log(`  - Location ID: ${l.id}, Address: ${l.address}`);
      return l.id;
    });

    const reviews = await db.Review.findAll({
      where: {
        location_id: {
          [db.Sequelize.Op.in]: locIds
        }
      },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['username']
        }
      ]
    });
    console.log(`FOUND ${reviews.length} REVIEWS FOR THESE LOCATIONS:`);
    reviews.forEach(r => {
      console.log(`  - Review ID: ${r.id}, Location ID: ${r.location_id}, User: ${r.user?.username}, Rating: ${r.rating}, Comment: ${r.comment}`);
    });
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await db.sequelize.close();
  }
}

checkReviews();
