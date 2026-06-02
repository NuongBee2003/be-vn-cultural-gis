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

        // --- Tile-based caching ---
        // Thay vì cache theo exact bbox (hit rate ~0% khi scroll),
        // ta snap bbox về tile boundary cố định → cùng khu vực = cùng key.
        // TILE_SIZE = 0.05 độ ≈ 5.5km, đủ chi tiết cho GIS đô thị.
        let tileKey = null;
        if (input.bbox) {
            try {
                const { tileKeys } = getTileKeysFromBbox(input.bbox);
                // Ghép tất cả tile keys thành một composite key (thường 1-4 tile)
                tileKey = `geo:${tileKeys.join('|')}:limit_${input.limit}`;

                const cachedData = await redisClient.get(tileKey);
                if (cachedData) {
                    return sendSuccess(res, JSON.parse(cachedData));
                }
            } catch (err) {
                console.error('Redis get error:', err);
            }
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

        // Lưu cache với TTL 10 phút (data geo không thay đổi quá thường xuyên)
        if (tileKey) {
            try {
                await redisClient.setEx(tileKey, 600, JSON.stringify(responseData));
            } catch (err) {
                console.error('Redis set error:', err);
            }
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
}

module.exports = new LocationManager();
