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
        });

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: comment,
        });
    });

    reply = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const parentId = commentController.parsePositiveInt(req.params.id, 'id');
        const parentComment = await commentController.getCommentById(parentId);
        if (!parentComment) {
            throw new HttpError(404, 'Comment not found');
        }

        const reply = await commentController.createComment({
            post_id: parentComment.post_id,
            user_id: userId,
            content: req.body?.content,
            parent_id: parentComment.id,
        });

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: reply,
        });
    });

    delete = asyncHandler(async (req, res) => {
        const commentId = commentController.parsePositiveInt(req.params.id, 'id');
        const comment = await commentController.getCommentById(commentId);
        if (!comment) {
            throw new HttpError(404, 'Comment not found');
        }

        const user = req.user || {};
        const isAdmin = String(user.role || '').toUpperCase() === 'ADMIN';
        if (!isAdmin && Number(req.userId) !== Number(comment.user_id)) {
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
