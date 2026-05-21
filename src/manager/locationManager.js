const locationController = require('../controller/LocationController');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/apiResponse');

class LocationManager {
    getLocationById = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            throw new HttpError(400, 'id must be a positive integer');
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
        const input = {
            ...(req.query || {}),
            ...(req.body || {}),
        };

        const locations = await locationController.getLocationsByViewport(input);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: locations,
            meta: {
                count: locations.length,
                limit: input.limit !== undefined ? Number(input.limit) : undefined,
                bbox: input.bbox,
                place_id: input.place_id !== undefined ? Number(input.place_id) : undefined,
                district_id: input.district_id !== undefined ? Number(input.district_id) : undefined,
            },
        });
    });

    getLocationsByCategory = asyncHandler(async (req, res) => {
        const categoryId = Number(req.params.categoryId);
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new HttpError(400, 'categoryId must be a positive integer');
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
            throw new HttpError(400, 'id must be a positive integer');
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
