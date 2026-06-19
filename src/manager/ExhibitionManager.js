const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const exhibitionController = require('../controller/ExhibitionController');
const db = require('../models');

class ExhibitionManager {
    getAll = asyncHandler(async (req, res) => {
        const exhibitions = await exhibitionController.getAllExhibitions(req.user || {}, req.query || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: exhibitions,
        });
    });

    getAllAdmin = asyncHandler(async (req, res) => {
        const exhibitions = await exhibitionController.getAllExhibitionsAdmin(req.query || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: exhibitions,
        });
    });

    getDetail = asyncHandler(async (req, res) => {
        const id = exhibitionController.parsePositiveInt(req.params.id, 'id');
        const exhibition = await exhibitionController.getExhibitionById(id);

        if (!exhibition) {
            throw new HttpError(404, 'Exhibition not found');
        }

        const user = req.user || {};
        const isAdmin = String(user.role || '').toLowerCase() === 'admin';
        const currentUserId = Number(user.userId || user.id);

        // Chỉ hiển thị bài viết chưa duyệt cho chủ sở hữu hoặc admin
        if (exhibition.status !== 'accepted' && !isAdmin && Number(exhibition.user_id) !== currentUserId) {
            throw new HttpError(403, 'Bạn không có quyền truy cập tác phẩm triển lãm này');
        }

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: exhibition,
        });
    });

    create = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const exhibition = await exhibitionController.createExhibition(req.body || {}, userId, req.user || {});

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: exhibition,
        });
    });

    update = asyncHandler(async (req, res) => {
        const id = exhibitionController.parsePositiveInt(req.params.id, 'id');
        const exhibition = await exhibitionController.getExhibitionById(id);

        if (!exhibition) {
            throw new HttpError(404, 'Exhibition not found');
        }

        if (!exhibitionController.isOwnerOrAdmin(exhibition, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        const updated = await exhibitionController.updateExhibition(exhibition, req.body || {}, req.user || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: updated,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const id = exhibitionController.parsePositiveInt(req.params.id, 'id');
        const exhibition = await exhibitionController.getExhibitionById(id);

        if (!exhibition) {
            throw new HttpError(404, 'Exhibition not found');
        }

        if (!exhibitionController.isOwnerOrAdmin(exhibition, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        await exhibitionController.deleteExhibition(exhibition);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });

    review = asyncHandler(async (req, res) => {
        const id = exhibitionController.parsePositiveInt(req.params.id, 'id');
        const exhibition = await exhibitionController.getExhibitionById(id);

        if (!exhibition) {
            throw new HttpError(404, 'Exhibition not found');
        }

        const statusVal = req.body?.status;
        if (!['accepted', 'rejected'].includes(statusVal)) {
            throw new HttpError(400, "status phê duyệt phải là 'accepted' hoặc 'rejected'");
        }

        const updated = await exhibitionController.updateExhibition(exhibition, { status: statusVal }, req.user || {});

        if (updated.user_id) {
            try {
                await db.Notification.create({
                    user_id: updated.user_id,
                    actor_id: req.userId,
                    post_id: null,
                    comment_id: null,
                    url: `/exhibition`,
                    message: statusVal === 'accepted'
                        ? `Tác phẩm triển lãm "${updated.title}" của bạn đã được duyệt`
                        : `Tác phẩm triển lãm "${updated.title}" của bạn đã bị từ chối`
                });
            } catch (notiErr) {
                console.error('Lỗi khi tạo thông báo duyệt triển lãm:', notiErr);
            }
        }

        return sendSuccess(res, {
            statusCode: 200,
            message: statusVal === 'accepted' ? 'Exhibition approved successfully' : 'Exhibition rejected successfully',
            data: updated,
        });
    });

    toggleLike = asyncHandler(async (req, res) => {
        const id = exhibitionController.parsePositiveInt(req.params.id, 'id');
        const action = req.body?.action;

        if (!action || !['like', 'unlike'].includes(action)) {
            throw new HttpError(400, "action phải là 'like' hoặc 'unlike'");
        }

        const updated = await exhibitionController.toggleLike(id, action);

        return sendSuccess(res, {
            statusCode: 200,
            message: action === 'like' ? 'Liked' : 'Unliked',
            data: {
                id: updated.id,
                likes: updated.likes
            },
        });
    });
}

module.exports = new ExhibitionManager();
