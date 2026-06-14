const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const postController = require('../controller/PostController');
const db = require('../models');

class PostManager {
    getAll = asyncHandler(async (req, res) => {
        const posts = await postController.getAllPosts(req.user || {});

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: posts,
        });
    });

    getAllAdmin = asyncHandler(async (req, res) => {
        const posts = await postController.getAllPostsAdmin(req.query || {});

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

        const user = req.user || {};
        const isAdmin = String(user.role || '').toLowerCase() === 'admin';
        const currentUserId = Number(user.userId || user.id);

        if (post.status !== 'accepted' && !isAdmin && Number(post.user_id) !== currentUserId) {
            throw new HttpError(403, 'Bạn không có quyền truy cập bài viết này');
        }

        const payload = post.toJSON ? post.toJSON() : post;
        const data = postController.addPermissionFlags(payload, user);

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

        const post = await postController.createPost(req.body || {}, userId, req.user || {});
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

        const updated = await postController.updatePost(post, req.body || {}, req.user || {});
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

    /**
     * Toggle like / unlike:
     * - Chưa like → tạo PostLike và trả về likedYN: 'Y'
     * - Đã like   → xóa PostLike  và trả về likedYN: 'N'
     */
    toggleLike = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const postId = postController.parsePositiveInt(req.params.id, 'id');

        // Kiểm tra post tồn tại
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const existing = await db.PostLike.findOne({
            where: { post_id: postId, user_id: userId },
        });

        let likedYN;
        if (existing) {
            await db.PostLike.destroy({
                where: { post_id: postId, user_id: userId }
            });
            likedYN = 'N';

            // Tự động xóa thông báo thích cũ nếu có
            try {
                await db.Notification.destroy({
                    where: {
                        user_id: post.user_id,
                        actor_id: userId,
                        post_id: postId,
                        comment_id: null,
                        message: 'đã thích bài viết của bạn'
                    }
                });
            } catch (notiErr) {
                console.error('Lỗi khi xóa thông báo thích bài viết:', notiErr);
            }
        } else {
            await db.PostLike.create({ 
                post_id: postId, 
                user_id: userId,
                created_at: new Date()
            });
            likedYN = 'Y';

            // Tự động tạo thông báo mới cho chủ bài viết nếu người thích là người khác
            if (post.user_id && Number(post.user_id) !== Number(userId)) {
                try {
                    await db.Notification.create({
                        user_id: post.user_id,
                        actor_id: userId,
                        post_id: postId,
                        comment_id: null,
                        url: `/post/${postId}`,
                        message: 'đã thích bài viết của bạn'
                    });
                } catch (notiErr) {
                    console.error('Lỗi khi tạo thông báo thích bài viết:', notiErr);
                }
            }
        }

        const likeCount = await db.PostLike.count({ where: { post_id: postId } });

        return sendSuccess(res, {
            statusCode: 200,
            message: likedYN === 'Y' ? 'Liked' : 'Unliked',
            data: { post_id: postId, likedYN, likeCount },
        });
    });

    getLikes = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');

        // Kiểm tra post tồn tại
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const likes = await db.PostLike.findAll({
            where: { post_id: postId },
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Map kết quả trả về mảng các User đơn giản
        const users = likes.map(like => ({
            id: like.user?.id,
            username: like.user?.username || 'Ẩn danh',
            avatar: like.user?.avatar || null
        }));

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: users,
        });
    });

    getComments = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');

        // Kiểm tra post tồn tại
        const post = await db.Post.findByPk(postId);
        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const page  = Number(req.query.page)  || 1;
        const limit = Number(req.query.limit) || 10;

        const commentController = require('../controller/CommentController');
        const result = await commentController.getCommentsByPost(postId, {
            page,
            limit,
            user: req.user || {},
        });

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: result,
        });
    });

    review = asyncHandler(async (req, res) => {
        const postId = postController.parsePositiveInt(req.params.id, 'id');
        const post = await postController.getPostById(postId);

        if (!post) {
            throw new HttpError(404, 'Post not found');
        }

        const statusVal = req.body?.status;
        if (!['accepted', 'rejected'].includes(statusVal)) {
            throw new HttpError(400, "status phê duyệt phải là 'accepted' hoặc 'rejected'");
        }

        const updated = await postController.updatePost(post, { status: statusVal }, req.user || {});
        const payload = updated.toJSON ? updated.toJSON() : updated;

        return sendSuccess(res, {
            statusCode: 200,
            message: statusVal === 'accepted' ? 'Post approved successfully' : 'Post rejected successfully',
            data: postController.addPermissionFlags(payload, req.user || {}),
        });
    });
}

module.exports = new PostManager();
