require('dotenv').config();
const db = require('../src/models');
const placeController = require('../src/controller/PlaceController');

async function run() {
  try {
    console.log("Searching for 'SOHO'...");
    const result = await placeController.getAllPlacesPaginated({ page: 1, limit: 5, query: 'SOHO' });
    console.log("SUCCESS! Returned total count:", result.count);
    for (const row of result.rows) {
      console.log("- Place:", {
        id: row.id,
        name: row.name,
        category: row.category ? row.category.name : null,
        locationsCount: row.locations ? row.locations.length : 0,
      });
    }
  } catch (e) {
    console.error("FAILED with error:", e);
  } finally {
    await db.sequelize.close();
  }
}
run();
