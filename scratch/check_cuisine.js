require('dotenv').config();
const db = require('../src/models');

async function check() {
  try {
    const cuisines = await db.Cuisine.findAll({
      where: { name: { [db.Sequelize.Op.like]: '%Bún đậu%' } },
      include: [
        {
          model: db.CuisinePlace,
          as: 'cuisine_places',
          include: [
            {
              model: db.Place,
              as: 'place',
              include: [
                { model: db.Location, as: 'locations' },
                { model: db.Asset, as: 'assets' }
              ]
            }
          ]
        }
      ]
    });
    
    console.log(`FOUND ${cuisines.length} CUISINES:`);
    for (const c of cuisines) {
      console.log(`\nCuisine ID: ${c.id}, Name: ${c.name}`);
      for (const cp of c.cuisine_places) {
        console.log(`  - CuisinePlace ID: ${cp.id}, Place ID: ${cp.place_id}, Notes: ${cp.notes}`);
        const p = cp.place;
        if (p) {
          console.log(`    Place Name: ${p.name}`);
          console.log(`    Assets count: ${p.assets.length}`);
          console.log(`    Locations count: ${p.locations.length}`);
          for (const l of p.locations) {
            console.log(`      Location ID: ${l.id}, Address: ${l.address}, Lat: ${l.lat}, Lng: ${l.lng}`);
          }
        } else {
          console.log(`    Place is NULL!`);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

check();
