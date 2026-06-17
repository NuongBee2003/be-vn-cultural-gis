const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const db = require('../src/models');

async function checkOM() {
  try {
    const places = await db.Place.findAll({
      where: {
        name: {
          [db.Sequelize.Op.like]: '%OM%'
        }
      },
      include: [
        {
          model: db.Location,
          as: 'locations'
        }
      ]
    });
    console.log(`FOUND ${places.length} PLACES WITH NAME LIKE 'OM':`);
    places.forEach(p => {
      console.log(`PLACE ID: ${p.id}, Name: ${p.name}`);
      p.locations.forEach(l => {
        console.log(`  - LOCATION ID: ${l.id}, Address: ${l.address}, Lat: ${l.lat}, Lng: ${l.lng}`);
      });
    });
  } catch (err) {
    console.error("Error connecting to DB:", err);
  } finally {
    await db.sequelize.close();
  }
}

checkOM();
