const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const folkArtController = require('../controller/FolkArtController');

class FolkArtManager {
    getAll = asyncHandler(async (req, res) => {
        const folkArts = await folkArtController.getAllFolkArts(req.query || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: folkArts,
        });
    });

    getDetail = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid folk art ID');
        }
        const folkArt = await folkArtController.getFolkArtById(id);
        if (!folkArt) {
            throw new HttpError(404, 'Folk art not found');
        }
        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: folkArt,
        });
    });

    create = asyncHandler(async (req, res) => {
        const folkArt = await folkArtController.createFolkArt(req.body || {});
        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: folkArt,
        });
    });

    update = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid folk art ID');
        }
        const updated = await folkArtController.updateFolkArt(id, req.body || {});
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: updated,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            throw new HttpError(400, 'Invalid folk art ID');
        }
        const result = await folkArtController.deleteFolkArt(id);
        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: result,
        });
    });
}

module.exports = new FolkArtManager();
