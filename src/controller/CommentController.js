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

    async createComment(payload, options = {}) {
        const { transaction } = options;
        const { post_id, user_id, content, parent_id } = payload;

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
            const parentComment = await this.getCommentById(parentId);
            if (!parentComment) {
                throw new HttpError(404, 'Parent comment not found');
            }
            if (parentComment.post_id !== parsedPostId) {
                throw new HttpError(400, 'parent_id không thuộc post_id này');
            }
        }

        return Comment.create(
            {
                post_id: parsedPostId,
                user_id: parsedUserId,
                parent_id: parentId,
                content: normalizedContent,
            },
            transaction ? { transaction } : undefined
        );
    }

    async deleteComment(comment, options = {}) {
        const { transaction } = options;
        await Comment.destroy({
            where: { parent_id: comment.id },
            ...(transaction ? { transaction } : {}),
        });
        return comment.destroy(transaction ? { transaction } : undefined);
    }
}

module.exports = new CommentController();
