const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const customController = require('../controller/CustomController');

class CustomManager {
    getAll = asyncHandler(async (req, res) => {
        const customs = await customController.getAllCustoms(req.query || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: customs,
        });
    });

    getDetail = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid custom ID');
        }
        const custom = await customController.getCustomById(id);
        if (!custom) {
            throw new HttpError(404, 'Custom not found');
        }
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: custom,
        });
    });

    create = asyncHandler(async (req, res) => {
        const custom = await customController.createCustom(req.body || {});
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: custom,
        });
    });

    update = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid custom ID');
        }
        const updated = await customController.updateCustom(id, req.body || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: updated,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid custom ID');
        }
        const result = await customController.deleteCustom(id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: result,
        });
    });
}

module.exports = new CustomManager();
