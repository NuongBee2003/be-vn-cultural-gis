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

    // GET /api/v1/search/place-locations-db?query=...&page=1&limit=20
    placeLocationsByDB = asyncHandler(async (req, res) => {
        const { query, page, limit } = req.query || {};
        const data = await searchController.searchPlaceLocationsByDB({
            query,
            page,
            limit,
        });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: data.items,
            meta: {
                page: data.page,
                limit: data.limit,
                total: data.total,
            },
        });
    });
}

module.exports = new SearchManager();
