const db = require('../models');

class PlaceController {
    parsePositiveInt(value, fieldName) {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
            const err = new Error(`${fieldName} must be a positive integer`);
            err.statusCode = 400;
            throw err;
        }
        return parsed;
    }

    async getAllPlaces() {
        return db.Place.findAll();
    }

    async getAllPlacesPaginated({ page = 1, limit = 20, categoryId = null, query = '', userId = null, isFeatured = null }) {
        const parsedPage = this.parsePositiveInt(page, 'page');
        const parsedLimit = this.parsePositiveInt(limit, 'limit');
        const offset = (parsedPage - 1) * parsedLimit;

        const where = {};
        if (categoryId) {
            where.category_id = this.parsePositiveInt(categoryId, 'categoryId');
        }

        if (userId) {
            where.user_id = this.parsePositiveInt(userId, 'userId');
        }

        if (isFeatured !== null && isFeatured !== undefined) {
            where.is_featured = isFeatured ? 1 : 0;
        }

        if (query && query.trim()) {
            const { Op } = require('sequelize');
            const likePattern = `%${query.trim()}%`;
            where[Op.or] = [
                { name: { [Op.like]: likePattern } },
                { description: { [Op.like]: likePattern } }
            ];
        }

        const ratingAvgSubquery = `(
            SELECT COALESCE(AVG(r.rating), 0)
            FROM reviews r
            JOIN locations l ON r.location_id = l.id
            WHERE l.place_id = Place.id
        )`;

        const reviewCountSubquery = `(
            SELECT COUNT(r.id)
            FROM reviews r
            JOIN locations l ON r.location_id = l.id
            WHERE l.place_id = Place.id
        )`;

        // Tự động dọn dẹp trạng thái is_featured = 1 của các địa điểm thuộc User đã hết hạn gói dịch vụ
        const { Op } = require('sequelize');
        await db.Place.update(
            { is_featured: 0 },
            {
                where: {
                    is_featured: 1,
                    user_id: {
                        [Op.and]: [
                            { [Op.ne]: null },
                            {
                                [Op.notIn]: db.sequelize.literal(`(
                                    SELECT DISTINCT user_id 
                                    FROM user_subscriptions 
                                    WHERE status = 'active' 
                                      AND (end_date IS NULL OR end_date > NOW())
                                )`)
                            }
                        ]
                    }
                }
            }
        ).catch(() => {});

        const { count, rows } = await db.Place.findAndCountAll({
            where,
            attributes: [
                'id', 'name', 'description', 'category_id', 'created_at', 'updated_at', 'is_featured', 'view_count',
                [db.sequelize.literal(ratingAvgSubquery), 'rating_avg'],
                [db.sequelize.literal(reviewCountSubquery), 'review_count']
            ],
            include: [
                {
                    model: db.Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon_marker', 'color'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address'],
                    required: false,
                    include: [
                        {
                            model: db.Asset,
                            as: 'assets',
                            attributes: ['id', 'url', 'is_primary'],
                            required: false,
                            where: {
                                post_id: null,
                                review_id: null,
                            },
                        }
                    ]
                },
            ],
            limit: parsedLimit,
            offset,
            order: [
                ['is_featured', 'DESC'],
                [db.sequelize.literal(ratingAvgSubquery), 'DESC'],
                ['view_count', 'DESC'],
                [db.sequelize.literal(reviewCountSubquery), 'DESC'],
                ['id', 'DESC']
            ],
            distinct: true,
        });

        return {
            rows,
            count,
            page: parsedPage,
            limit: parsedLimit,
        };
    }

    calculateRatingAvg(reviews = []) {
        if (!Array.isArray(reviews) || reviews.length === 0) {
            return null;
        }

        let total = 0;
        let count = 0;

        for (const review of reviews) {
            const rating = Number(review?.rating);
            if (!Number.isNaN(rating)) {
                total += rating;
                count += 1;
            }
        }

        if (count === 0) {
            return null;
        }

        return Number((total / count).toFixed(2));
    }

    async getPlaceDetail(id) {
        const placeId = this.parsePositiveInt(id, 'id');
        const place = await db.Place.findByPk(placeId, {
            attributes: ['id', 'name', 'description', 'category_id', 'created_at', 'updated_at', 'is_featured', 'view_count'],
            include: [
                {
                    model: db.Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon_marker'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address'],
                    required: false,
                    include: [
                        {
                            model: db.Asset,
                            as: 'assets',
                            attributes: ['id', 'url', 'is_primary'],
                            required: false,
                            where: {
                                post_id: null,
                                review_id: null,
                            },
                        },
                        {
                            model: db.Review,
                            as: 'reviews',
                            attributes: ['id', 'user_id', 'location_id', 'rating', 'comment', 'created_at'],
                            required: false,
                            include: [
                                {
                                    model: db.User,
                                    as: 'user',
                                    attributes: ['id', 'username', 'avatar'],
                                    required: false,
                                },
                                {
                                    model: db.Asset,
                                    as: 'assets',
                                    attributes: ['id', 'url'],
                                    required: false,
                                },
                                {
                                    model: db.ReviewLike,
                                    as: 'review_likes',
                                    attributes: ['user_id'],
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
                            ],
                        },
                    ],
                },
            ],
        });

        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        // Tăng số lượt xem (view_count)
        await place.increment('view_count').catch(err => {
            // eslint-disable-next-line no-console
            console.error('Error incrementing view_count:', err);
        });
        place.view_count = (place.view_count || 0) + 1;

        const placeJson = place.toJSON();
        placeJson.view_count = place.view_count;
        const reviews = [];
        const assets = [];
        for (const location of placeJson.locations || []) {
            if (Array.isArray(location.reviews)) {
                reviews.push(...location.reviews);
            }
            if (Array.isArray(location.assets)) {
                assets.push(...location.assets);
            }
        }

        const rating_avg = this.calculateRatingAvg(reviews);

        return { ...placeJson, assets, rating_avg };
    }

    async getPlaceWithLocations(id) {
        const placeId = this.parsePositiveInt(id, 'id');
        return db.Place.findByPk(placeId, {
            include: [
                {
                    model: db.Category,
                    as: 'category',
                    attributes: ['id', 'name', 'icon_marker'],
                    required: false,
                },
                {
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address'],
                    required: true,
                },
            ],
        });
    }

    async createPlace(payload, options = {}) {
        const { transaction } = options;
        const { name, description, category_id, user_id, is_featured } = payload || {};

        if (!name || typeof name !== 'string') {
            const err = new Error('name is required');
            err.statusCode = 400;
            throw err;
        }

        let finalCategoryId = category_id;
        if (!finalCategoryId) {
            const otherCat = await db.Category.findOne({
                where: { name: 'Khác' },
                transaction
            });
            if (otherCat) {
                finalCategoryId = otherCat.id;
            }
        }

        return db.Place.create(
            {
                name,
                description,
                category_id: finalCategoryId,
                user_id: user_id || null,
                is_featured: is_featured ? 1 : 0,
            },
            transaction ? { transaction } : undefined
        );
    }

    async updatePlace(id, payload, options = {}) {
        const { transaction } = options;
        const placeId = this.parsePositiveInt(id, 'id');

        const place = await db.Place.findByPk(placeId, transaction ? { transaction } : undefined);
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        const { name, description, category_id, is_featured } = payload || {};

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (is_featured !== undefined) updates.is_featured = is_featured ? 1 : 0;
        
        if (category_id !== undefined) {
            let finalCategoryId = category_id;
            if (!finalCategoryId) {
                const otherCat = await db.Category.findOne({
                    where: { name: 'Khác' },
                    transaction
                });
                if (otherCat) {
                    finalCategoryId = otherCat.id;
                }
            }
            updates.category_id = finalCategoryId;
        }

        updates.updated_at = db.sequelize.literal('CURRENT_TIMESTAMP(3)');

        await place.update(updates, transaction ? { transaction } : undefined);
        return place;
    }

    async createReviewForPlace(placeIdInput, payload, userIdInput) {
        const placeId = this.parsePositiveInt(placeIdInput, 'id');
        const userId = this.parsePositiveInt(userIdInput, 'user_id');

        const place = await db.Place.findByPk(placeId, {
            attributes: ['id', 'name'],
        });

        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        const rating = Number(payload?.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            const err = new Error('rating must be an integer between 1 and 5');
            err.statusCode = 400;
            throw err;
        }

        const rawComment = payload?.comment;
        const comment = rawComment === undefined || rawComment === null ? null : String(rawComment).trim() || null;

        // Cho phép truyền location_id để tạo review cho chi nhánh cụ thể
        const targetLocationId = payload?.location_id || payload?.locationId;
        let location;

        if (targetLocationId) {
            location = await db.Location.findOne({
                where: { id: targetLocationId, place_id: placeId },
                attributes: ['id', 'lat', 'lng', 'address', 'place_id'],
            });
            if (!location) {
                const err = new Error('Location not found or does not belong to this place');
                err.statusCode = 400;
                throw err;
            }
        } else {
            location = await db.Location.findOne({
                where: { place_id: placeId },
                attributes: ['id', 'lat', 'lng', 'address', 'place_id'],
                order: [['id', 'ASC']],
            });
            if (!location) {
                const err = new Error('No location found for this place');
                err.statusCode = 400;
                throw err;
            }
        }

        const review = await db.Review.create({
            user_id: userId,
            location_id: location.id,
            rating,
            comment,
        });

        return db.Review.findByPk(review.id, {
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
                    attributes: ['id', 'lat', 'lng', 'address', 'place_id'],
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
            ],
        });
    }

    async deletePlace(id) {
        const placeId = this.parsePositiveInt(id, 'id');

        const place = await db.Place.findByPk(placeId);
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        await place.destroy();
        return { id: placeId };
    }
}

module.exports = new PlaceController();
