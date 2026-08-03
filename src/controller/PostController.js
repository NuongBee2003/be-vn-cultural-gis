const db = require('../models');
const HttpError = require('../utils/httpError');

const Post = db.Post;

class PostController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            throw new HttpError(400, `${fieldName} phải là một số nguyên dương`);
        }
        return parsed;
    }

    normalizeText(value, fieldName) {
        if (typeof value !== 'string') {
            throw new HttpError(400, `${fieldName} phải là chuỗi`);
        }

        const trimmed = value.trim();
        if (!trimmed) {
            throw new HttpError(400, `${fieldName} không được để trống`);
        }

        return trimmed;
    }

    isOwnerOrAdmin(record, user) {
        if (!record || !user) return false;
        const role = String(user.role || '').toUpperCase();
        const currentUserId = Number(user.userId || user.id);
        return role === 'ADMIN' || currentUserId === Number(record.user_id);
    }

    /**
     * Gắn editYN / delYN vào một bài post (đã ở dạng plain object).
     * Đồng thời tính likeCount và likedYN từ mảng post_likes.
     */
    addPermissionFlags(post, user) {
        const canEdit = this.isOwnerOrAdmin(post, user);
        const currentUserId = Number(user.userId || user.id);

        const likes = Array.isArray(post.post_likes) ? post.post_likes : [];
        const likeCount = likes.length;
        const likedYN = likes.some((l) => Number(l.user_id) === currentUserId) ? 'Y' : 'N';

        // Gắn editYN/delYN vào từng comment
        const comments = Array.isArray(post.comments)
            ? post.comments.map((c) => this.addCommentPermissionFlags(c, user))
            : [];

        return {
            ...post,
            likeCount,
            likedYN,
            editYN: canEdit ? 'Y' : 'N',
            delYN: canEdit ? 'Y' : 'N',
            comments,
        };
    }

    /**
     * Gắn editYN / delYN vào một comment (đã ở dạng plain object).
     */
    addCommentPermissionFlags(comment, user) {
        const canEdit = this.isOwnerOrAdmin(comment, user);
        return {
            ...comment,
            editYN: canEdit ? 'Y' : 'N',
            delYN: canEdit ? 'Y' : 'N',
        };
    }

    _buildInclude() {
        return [
            {
                model: db.User,
                as: 'user',
                attributes: ['id', 'username', 'avatar'],
                required: false,
            },
            {
                model: db.Asset,
                as: 'assets',
                required: false,
            },
            {
                model: db.Location,
                as: 'location',
                attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'status'],
                required: false,
                include: [
                    {
                        model: db.Place,
                        as: 'place',
                        attributes: ['id', 'name'],
                        required: false,
                    },
                ],
            },
            {
                model: db.Comment,
                as: 'comments',
                required: false,
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['id', 'username', 'avatar'],
                        required: false,
                    },
                ],
            },
            {
                model: db.PostLike,
                as: 'post_likes',
                attributes: ['user_id', 'created_at'],
                required: false,
            },
        ];
    }

    async getPostById(id) {
        return Post.findByPk(id, {
            include: this._buildInclude(),
        });
    }

    async getAllPosts(user, queryParams = {}) {
        const currentUserId = user ? Number(user.userId || user.id) : null;
        const whereClause = {};

        // User thường chỉ thấy bài viết đã duyệt ('accepted') HOẶC bài viết của chính họ
        const orConditions = [{ status: 'accepted' }];
        if (currentUserId) {
            orConditions.push({ user_id: currentUserId });
        }
        whereClause[db.Sequelize.Op.or] = orConditions;

        // Lọc theo ngày bắt đầu và kết thúc
        if (queryParams.date_from || queryParams.date_to) {
            const dateFilter = {};
            let hasFilter = false;
            
            if (queryParams.date_from) {
                const parts = queryParams.date_from.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const fromDate = new Date(year, month, day, 0, 0, 0, 0);
                    if (!isNaN(fromDate.getTime())) {
                        dateFilter[db.Sequelize.Op.gte] = fromDate;
                        hasFilter = true;
                    }
                }
            }
            if (queryParams.date_to) {
                const parts = queryParams.date_to.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const toDate = new Date(year, month, day, 23, 59, 59, 999);
                    if (!isNaN(toDate.getTime())) {
                        dateFilter[db.Sequelize.Op.lte] = toDate;
                        hasFilter = true;
                    }
                }
            }
            if (hasFilter) {
                whereClause.created_at = dateFilter;
            }
        }

        const posts = await Post.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: this._buildInclude(),
        });

        return posts.map((postInstance) => {
            const post = postInstance.toJSON ? postInstance.toJSON() : postInstance;
            return this.addPermissionFlags(post, user || {});
        });
    }

    async getAllPostsAdmin(queryParams = {}) {
        const whereClause = {};

        if (queryParams.status) {
            whereClause.status = queryParams.status;
        }

        // Lọc theo ngày bắt đầu và kết thúc
        if (queryParams.date_from || queryParams.date_to) {
            const dateFilter = {};
            let hasFilter = false;
            
            if (queryParams.date_from) {
                const parts = queryParams.date_from.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const fromDate = new Date(year, month, day, 0, 0, 0, 0);
                    if (!isNaN(fromDate.getTime())) {
                        dateFilter[db.Sequelize.Op.gte] = fromDate;
                        hasFilter = true;
                    }
                }
            }
            if (queryParams.date_to) {
                const parts = queryParams.date_to.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    const toDate = new Date(year, month, day, 23, 59, 59, 999);
                    if (!isNaN(toDate.getTime())) {
                        dateFilter[db.Sequelize.Op.lte] = toDate;
                        hasFilter = true;
                    }
                }
            }
            if (hasFilter) {
                whereClause.created_at = dateFilter;
            }
        }

        const posts = await Post.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            include: this._buildInclude(),
        });

        return posts.map((postInstance) => {
            const post = postInstance.toJSON ? postInstance.toJSON() : postInstance;
            return this.addPermissionFlags(post, { role: 'admin' });
        });
    }

    async createPost(payload, userIdInput, user) {
        const userId = this.parsePositiveInt(userIdInput, 'user_id');
        const title = this.normalizeText(payload?.title, 'title');
        const content = this.normalizeText(payload?.content, 'content');

        let locationId = null;
        if (payload?.location_id !== undefined && payload?.location_id !== null && payload?.location_id !== '') {
            locationId = this.parsePositiveInt(payload.location_id, 'location_id');
            const location = await db.Location.findByPk(locationId);
            if (!location) {
                throw new HttpError(404, 'Location not found');
            }
        }

        const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';
        // User tạo -> pending, Admin tạo -> accepted (hoặc theo status truyền vào)
        const status = isAdmin ? (payload?.status || 'accepted') : 'pending';

        const post = await Post.create({
            user_id: userId,
            location_id: locationId,
            title,
            content,
            status,
        });

        // Insert assets (images) if provided
        if (payload?.images && Array.isArray(payload.images)) {
            for (const imageUrl of payload.images) {
                await db.Asset.create({
                    url: imageUrl,
                    post_id: post.id,
                    is_primary: false,
                });
            }
        }

        return this.getPostById(post.id);
    }

    async updatePost(post, payload, user) {
        const updates = {};

        if (payload?.title !== undefined) {
            updates.title = this.normalizeText(payload.title, 'title');
        }

        if (payload?.content !== undefined) {
            updates.content = this.normalizeText(payload.content, 'content');
        }

        if (payload?.location_id !== undefined) {
            if (payload.location_id === null || payload.location_id === '') {
                updates.location_id = null;
            } else {
                const locationId = this.parsePositiveInt(payload.location_id, 'location_id');
                const location = await db.Location.findByPk(locationId);
                if (!location) {
                    throw new HttpError(404, 'Location not found');
                }
                updates.location_id = locationId;
            }
        }

        const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';
        if (isAdmin) {
            if (payload?.status !== undefined) {
                const statusVal = this.normalizeText(payload.status, 'status');
                if (!['pending', 'accepted', 'rejected'].includes(statusVal)) {
                    throw new HttpError(400, "status phải là 'pending', 'accepted' hoặc 'rejected'");
                }
                updates.status = statusVal;
            }
        } else {
            // User sửa -> ép về pending
            updates.status = 'pending';
        }

        await post.update(updates);
        return this.getPostById(post.id);
    }

    async deletePost(post) {
        // Delete post assets first to prevent constraint violations
        await db.Asset.destroy({ where: { post_id: post.id } });
        await post.destroy();
        return { id: post.id };
    }
}

module.exports = new PostController();
