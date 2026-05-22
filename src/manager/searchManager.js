const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const searchController = require('../controller/SearchController');

class SearchManager {
    // GET /api/v1/search/place-locations?q=...&size=20
    // GET /api/v1/search/place-locations?lat=...&lng=...&radius=200m&size=20
    placeLocations = asyncHandler(async (req, res) => {
        const { q, lat, lng, radius, size } = req.query || {};
        const data = await searchController.searchPlaceLocations({ q, lat, lng, radius, size });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: data.items,
            meta: {
                mode: data.mode,
                total: data.total,
                size: Number(size) || 20,
                radius: radius || '200m',
                index: process.env.ELASTICSEARCH_PLACE_LOCATIONS_INDEX || 'place_locations',
            },
        });
    });
}

module.exports = new SearchManager();
