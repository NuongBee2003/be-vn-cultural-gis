const locationController = require('../controller/LocationController');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/apiResponse');
const redisClient = require('../config/redisClient');
const { getTileKeysFromBbox } = require('../utils/geoTile');

class LocationManager {

    getLocationById = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id phải là một số nguyên dương');
        }
        const location = await locationController.getLocationById(id);
        if (!location) {
            throw new HttpError(404, 'Location not found');
        }
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: location,
        });
    });

    getLocationsByGeo = asyncHandler(async (req, res) => {
        const input = req.body || {};
        const cacheKey = `locations_geo:${JSON.stringify(input)}`;

        try {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return sendSuccess(res, JSON.parse(cachedData));
            }
        } catch (err) {
            console.error('Redis get error:', err);
        }

        const locations = await locationController.getLocationsByViewport(input);

        const responseData = {
            statusCode: 200,
            message: 'OK',
            data: locations,
            meta: {
                count: locations.length,
                limit: input.limit,
                bbox: input.bbox,
            },
        };

        try {
            // Cache 5 phút cho query chính xác
            await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
        } catch (err) {
            console.error('Redis set error:', err);
        }

        return sendSuccess(res, responseData);
    });

    getLocationsByCategory = asyncHandler(async (req, res) => {
        const categoryId = Number(req.params.categoryId);
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new HttpError(400, 'categoryId phải là một số nguyên dương');
        }

        const locations = await locationController.getLocationsByCategory(categoryId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: locations,
            meta: {
                count: locations.length,
                category_id: categoryId,
            },
        });
    });

    create = asyncHandler(async (req, res) => {
        const location = await locationController.createLocation(req.body);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: location,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id phải là một số nguyên dương');
        }
        const location = await locationController.getLocationById(id);
        if (!location) {
            throw new HttpError(404, 'Location not found');
        }
        await locationController.deleteLocation(location);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });

    getAllLocations = asyncHandler(async (req, res) => {
        try {
            console.log("🔵 getAllLocations manager called");
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            
            console.log("📥 Query params - page:", page, "limit:", limit);
            
            const result = await locationController.getAllLocations(page, limit);
            console.log("✅ Controller returned:", result);
            
            const totalPages = Math.ceil(result.count / result.limit);
            
            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: result.rows,
                meta: {
                    total: result.count,
                    count: result.rows.length,
                    page: result.page,
                    limit: result.limit,
                    totalPages: totalPages,
                },
            });
        } catch (err) {
            console.error("🔴 getAllLocations manager error:", err.message);
            console.error("🔴 Error:", err);
            throw err;
        }
    });
}

module.exports = new LocationManager();
