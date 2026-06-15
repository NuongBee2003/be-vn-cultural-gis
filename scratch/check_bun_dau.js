require('dotenv').config();
const db = require('../src/models');

async function check() {
  try {
    const place = await db.Place.findOne({
      where: { name: { [db.Sequelize.Op.like]: '%Bún đậu%' } },
      include: [
        { model: db.Asset, as: 'assets' },
        { model: db.Location, as: 'locations' }
      ]
    });
    
    if (place) {
      console.log("PLACE FOUND:");
      console.log("ID:", place.id);
      console.log("Name:", place.name);
      console.log("Assets count:", place.assets.length);
      console.log("Assets:", place.assets.map(a => ({ id: a.id, url: a.url, is_primary: a.is_primary })));
      console.log("Locations:", place.locations.map(l => ({ id: l.id, address: l.address, lat: l.lat, lng: l.lng })));
    } else {
      console.log("Place 'Bún đậu' NOT found in DB!");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

check();
