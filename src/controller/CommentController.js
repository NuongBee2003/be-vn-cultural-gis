const db = require('../models');
const HttpError = require('../utils/httpError');

const Comment = db.Comment;

class CommentController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            throw new HttpError(400, `${fieldName} phải là một số nguyên dương`);
        }
        return parsed;
    }

    normalizeContent(content) {
        if (typeof content !== 'string') {
            throw new HttpError(400, 'content phải là chuỗi');
        }
        const trimmed = content.trim();
        if (!trimmed) {
            throw new HttpError(400, 'content không được để trống');
        }
        return trimmed;
    }

    async getPostById(id) {
        return db.Post.findByPk(id);
    }

    async getUserById(id) {
        return db.User.findByPk(id);
    }

    async getCommentById(id) {
        return Comment.findByPk(id);
    }

    /**
     * Lấy comment kèm thông tin user (dùng cho response sau create/update).
     */
    async getCommentWithUser(id) {
        return Comment.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                    required: false,
                },
            ],
        });
    }

    isOwnerOrAdmin(comment, user) {
        if (!comment || !user) return false;
        const role = String(user.role || '').toUpperCase();
        const currentUserId = Number(user.userId || user.id);
        return role === 'ADMIN' || currentUserId === Number(comment.user_id);
    }

    /**
     * Gắn editYN / delYN vào comment (plain object).
     */
    addPermissionFlags(comment, user) {
        const canEdit = this.isOwnerOrAdmin(comment, user);
        return {
            ...comment,
            editYN: canEdit ? 'Y' : 'N',
            delYN: canEdit ? 'Y' : 'N',
        };
    }

    async updateComment(comment, payload) {
        const normalizedContent = this.normalizeContent(payload?.content);

        comment.content = normalizedContent;
        await comment.save();

        return comment;
    }

    async createComment(payload, options = {}) {
        const { transaction, parentComment } = options;
        const { post_id, user_id, content, parent_id, mentioned_user_ids } = payload;

        const parsedPostId = this.parsePositiveInt(post_id, 'post_id');
        const parsedUserId = this.parsePositiveInt(user_id, 'user_id');
        const normalizedContent = this.normalizeContent(content);

        const [post, user] = await Promise.all([
            this.getPostById(parsedPostId),
            this.getUserById(parsedUserId),
        ]);

        if (!post) {
            throw new HttpError(404, 'Post not found');
        }
        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        let parentId = null;
        if (parent_id !== undefined && parent_id !== null) {
            parentId = this.parsePositiveInt(parent_id, 'parent_id');
            const resolvedParent =
                parentComment && Number(parentComment.id) === parentId
                    ? parentComment
                    : await this.getCommentById(parentId);
            if (!resolvedParent) {
                throw new HttpError(404, 'Parent comment not found');
            }
            if (resolvedParent.post_id !== parsedPostId) {
                throw new HttpError(400, 'parent_id không thuộc post_id này');
            }
        }

        const created = await Comment.create(
            {
                post_id: parsedPostId,
                user_id: parsedUserId,
                parent_id: parentId,
                content: normalizedContent,
            },
            transaction ? { transaction } : undefined
        );

        try {
            const postUrl = `/post/${parsedPostId}`;

            if (post.user_id && Number(post.user_id) !== Number(parsedUserId)) {
                await db.Notification.create({
                    user_id: post.user_id,
                    actor_id: parsedUserId,
                    post_id: parsedPostId,
                    comment_id: created.id,
                    url: postUrl,
                    message: 'Đã nhắc đến bạn trong bình luận',
                }, transaction ? { transaction } : undefined);
            }

            if (parentId) {
                const parent = parentComment || (await this.getCommentById(parentId));
                if (parent && Number(parent.user_id) !== Number(parsedUserId)) {
                    await db.Notification.create({
                        user_id: parent.user_id,
                        actor_id: parsedUserId,
                        post_id: parsedPostId,
                        comment_id: created.id,
                        url: postUrl,
                        message: 'Có người trả lời bình luận của bạn',
                    }, transaction ? { transaction } : undefined);
                }
            }

            // --- Xử lý mention (@nhắc tên) ---
            // FE gửi mentioned_user_ids (numeric[]) từ react-mentions — chính xác hơn regex.
            // Chỉ gửi notification nếu array không rỗng.
            const mentionIds = Array.isArray(mentioned_user_ids)
                ? mentioned_user_ids.map(Number).filter(Boolean)
                : [];

            for (const mentionedId of mentionIds) {
                if (mentionedId === Number(parsedUserId)) continue; // bỏ qua tự nhắc mình
                await db.Notification.create({
                    user_id: mentionedId,
                    actor_id: parsedUserId,
                    post_id: parsedPostId,
                    comment_id: created.id,
                    url: postUrl,
                    message: 'Bạn được nhắc tên trong bình luận',
                }, transaction ? { transaction } : undefined);
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        return created;
    }

    async deleteComment(comment, options = {}) {
        const { transaction } = options;
        await Comment.destroy({
            where: { parent_id: comment.id },
            ...(transaction ? { transaction } : {}),
        });
        return comment.destroy(transaction ? { transaction } : undefined);
    }

    /**
     * Lấy danh sách comment (top-level) kèm replies lồng nhau và thông tin user.
     * Chỉ lấy comment gốc (parent_id IS NULL), mỗi comment gốc chứa mảng replies.
     *
     * @param {number} postId
     * @param {{ page?: number; limit?: number; user?: object }} options
     * @returns {{ data: object[]; total: number; page: number; totalPages: number }}
     */
    async getCommentsByPost(postId, options = {}) {
        const page  = Math.max(1, options.page  || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const offset = (page - 1) * limit;
        const user  = options.user || {};

        const userInclude = {
            model: db.User,
            as: 'user',
            attributes: ['id', 'username', 'avatar'],
            required: false,
        };

        // Đếm tổng comment gốc
        const total = await Comment.count({
            where: { post_id: postId, parent_id: null },
        });

        // Lấy comment gốc kèm replies (1 cấp) và user
        const rows = await Comment.findAll({
            where: { post_id: postId, parent_id: null },
            include: [
                userInclude,
                {
                    model: db.Comment,
                    as: 'comments',
                    include: [userInclude],
                    order: [['created_at', 'ASC']],
                },
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
        });

        const data = rows.map((row) => {
            const plain = row.toJSON ? row.toJSON() : row;
            const replies = (plain.comments || []).map((r) =>
                this.addPermissionFlags(r, user)
            );
            return {
                ...this.addPermissionFlags({ ...plain, comments: undefined }, user),
                replies,
                replyCount: replies.length,
            };
        });

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
}

module.exports = new CommentController();
