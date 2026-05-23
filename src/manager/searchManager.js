const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const searchController = require('../controller/SearchController');

class SearchManager {
    // GET /api/v1/search/place-locations?query=...
    placeLocations = asyncHandler(async (req, res) => {
        const { query } = req.query || {};
        const data = await searchController.searchPlaceLocations({ query });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: data.items,
            meta: {
                total: data.total,
                index: process.env.ELASTICSEARCH_PLACE_LOCATIONS_INDEX || 'place_locations',
            },
        });
    });
}

module.exports = new SearchManager();
