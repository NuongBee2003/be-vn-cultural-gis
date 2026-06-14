const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const commentController = require('../controller/CommentController');

class CommentManager {
    create = asyncHandler(async (req, res) => {
        const payload = req.body || {};
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const comment = await commentController.createComment({
            post_id: payload.post_id,
            user_id: userId,
            content: payload.content,
            parent_id: payload.parent_id,
            // IDs user được nhắc tên — do FE (react-mentions) xác định chính xác
            mentioned_user_ids: payload.mentioned_user_ids,
        });

        // Fetch lại kèm user info để trả về đầy đủ
        const full = await commentController.getCommentWithUser(comment.id);
        const plain = full ? (full.toJSON ? full.toJSON() : full) : comment;

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: commentController.addPermissionFlags(plain, req.user || {}),
        });
    });

    update = asyncHandler(async (req, res) => {
        const commentId = commentController.parsePositiveInt(req.params.id, 'id');
        const comment = await commentController.getCommentById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        if (!commentController.isOwnerOrAdmin(comment, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        await commentController.updateComment(comment, req.body || {});

        // Fetch lại kèm user info
        const full = await commentController.getCommentWithUser(commentId);
        const plain = full ? (full.toJSON ? full.toJSON() : full) : comment;

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: commentController.addPermissionFlags(plain, req.user || {}),
        });
    });

    delete = asyncHandler(async (req, res) => {
        const commentId = commentController.parsePositiveInt(req.params.id, 'id');
        const comment = await commentController.getCommentById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        if (!commentController.isOwnerOrAdmin(comment, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        await commentController.deleteComment(comment);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });
}

module.exports = new CommentManager();
