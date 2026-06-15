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
            attributes: ['id', 'name', 'description', 'category_id', 'created_at', 'updated_at'],
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

        const placeJson = place.toJSON();
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
        const { name, description, category_id } = payload || {};

        if (!name || typeof name !== 'string') {
            const err = new Error('name is required');
            err.statusCode = 400;
            throw err;
        }

        return db.Place.create(
            {
                name,
                description,
                category_id,
            },
            transaction ? { transaction } : undefined
        );
    }

    async updatePlace(id, payload) {
        const placeId = this.parsePositiveInt(id, 'id');

        const place = await db.Place.findByPk(placeId);
        if (!place) {
            const err = new Error('Place not found');
            err.statusCode = 404;
            throw err;
        }

        const { name, description, category_id } = payload || {};

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (category_id !== undefined) updates.category_id = category_id;

        updates.updated_at = db.sequelize.literal('CURRENT_TIMESTAMP(3)');

        await place.update(updates);
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

        const location = await db.Location.findOne({
            where: { place_id: placeId },
            attributes: ['id', 'lat', 'lng', 'address', 'place_id'],
            order: [['id', 'ASC']],
        });

        if (!location) {
            const err = new Error('No location found for this place');
            err.statusCode = 400;
            throw err;
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
