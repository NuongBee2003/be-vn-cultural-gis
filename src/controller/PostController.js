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

    isOwnerOrAdmin(post, user) {
        if (!post || !user) return false;

        const role = String(user.role || '').toUpperCase();
        return role === 'ADMIN' || Number(user.userId || user.id) === Number(post.user_id);
    }

    addPermissionFlags(post, user) {
        const canEdit = this.isOwnerOrAdmin(post, user);
        return {
            ...post,
            editYN: canEdit ? 'Y' : 'N',
            delYN: canEdit ? 'Y' : 'N',
        };
    }

    async getPostById(id) {
        return Post.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'location',
                    attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'district_id'],
                    required: false,
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                        {
                            model: db.District,
                            as: 'district',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                    ],
                },
            ],
        });
    }

    async getAllPosts(user) {
        const posts = await Post.findAll({
            order: [['created_at', 'DESC']],
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'avatar'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'location',
                    attributes: ['id', 'lat', 'lng', 'address', 'place_id', 'district_id'],
                    required: false,
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                        {
                            model: db.District,
                            as: 'district',
                            attributes: ['id', 'name'],
                            required: false,
                        },
                    ],
                },
            ],
        });

        const postList = posts.map((postInstance) => {
            const post = postInstance.toJSON ? postInstance.toJSON() : postInstance;
            return this.addPermissionFlags(post, user);
        });

        return postList;
    }

    async createPost(payload, userIdInput) {
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

        const post = await Post.create({
            user_id: userId,
            location_id: locationId,
            title,
            content,
            status: payload?.status || 'accepted',
        });

        return this.getPostById(post.id);
    }

    async updatePost(post, payload) {
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

        if (payload?.status !== undefined) {
            updates.status = this.normalizeText(payload.status, 'status');
        }

        await post.update(updates);
        return this.getPostById(post.id);
    }

    async deletePost(post) {
        await post.destroy();
        return { id: post.id };
    }
}

module.exports = new PostController();
