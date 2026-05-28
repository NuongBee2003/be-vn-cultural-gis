const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const postController = require('../controller/PostController');

class PostManager {
    getAll = asyncHandler(async (req, res) => {
        const posts = await postController.getAllPosts(req.user || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: posts,
        });
    });

    getDetail = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');
        const post = await postController.getPostById(postId);

        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const payload = post.toJSON ? post.toJSON() : post;
        const data = postController.addPermissionFlags(payload, req.user || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data,
        });
    });

    create = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const post = await postController.createPost(req.body || {}, userId);
        const payload = post.toJSON ? post.toJSON() : post;

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: postController.addPermissionFlags(payload, req.user || {}),
        });
    });

    update = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');
        const post = await postController.getPostById(postId);

        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (!postController.isOwnerOrAdmin(post, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        const updated = await postController.updatePost(post, req.body || {});
        const payload = updated.toJSON ? updated.toJSON() : updated;

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Updated',
            data: postController.addPermissionFlags(payload, req.user || {}),
        });
    });

    delete = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');
        const post = await postController.getPostById(postId);

        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        if (!postController.isOwnerOrAdmin(post, req.user || {})) {
            throw new HttpError(403, 'Forbidden');
        }

        await postController.deletePost(post);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });
}

module.exports = new PostManager();
