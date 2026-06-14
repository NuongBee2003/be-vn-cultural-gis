const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const cuisineController = require('../controller/CuisineController');

class CuisineManager {
    getAll = asyncHandler(async (req, res) => {
        const cuisines = await cuisineController.getAllCuisines(req.query || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: cuisines,
        });
    });

    getDetail = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid cuisine ID');
        }
        const cuisine = await cuisineController.getCuisineById(id);
        if (!cuisine) {
            throw new HttpError(404, 'Cuisine not found');
        }
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: cuisine,
        });
    });

    create = asyncHandler(async (req, res) => {
        const cuisine = await cuisineController.createCuisine(req.body || {});
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: cuisine,
        });
    });

    update = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid cuisine ID');
        }
        const updated = await cuisineController.updateCuisine(id, req.body || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: updated,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid cuisine ID');
        }
        const result = await cuisineController.deleteCuisine(id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: result,
        });
    });

    addRecommendation = asyncHandler(async (req, res) => {
        const cuisineId = Number(req.params.id);
        const { place_id, notes } = req.body || {};
        
        if (isNaN(cuisineId)) {
            throw new HttpError(400, 'Invalid cuisine ID');
        }
        if (!place_id) {
            throw new HttpError(400, 'place_id is required');
        }
        
        const rec = await cuisineController.addRecommendation(cuisineId, Number(place_id), notes);
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Recommendation added',
            data: rec,
        });
    });

    removeRecommendation = asyncHandler(async (req, res) => {
        const recId = Number(req.params.recId);
        if (isNaN(recId)) {
            throw new HttpError(400, 'Invalid recommendation link ID');
        }
        const result = await cuisineController.removeRecommendation(recId);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Recommendation removed',
            data: result,
        });
    });
}

module.exports = new CuisineManager();
