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

    parseOptionalLatLng(value, fieldName, min, max) {
        if (value === undefined || value === null || value === '') return null;
        const parsed = Number(value);
        if (Number.isNaN(parsed) || parsed < min || parsed > max) {
            const err = new Error(`${fieldName} must be a number between ${min} and ${max}`);
            err.statusCode = 400;
            throw err;
        }
        return parsed;
    }

    async getAllPlaces() {
        return db.Place.findAll();
    }

    buildPlaceDetailResponse(placeInstance) {
        if (!placeInstance) return null;

        const place = placeInstance.toJSON ? placeInstance.toJSON() : placeInstance;

        const toNumberOrNull = (value) => {
            if (value === null || value === undefined || value === '') return null;
            const n = Number(value);
            return Number.isNaN(n) ? null : n;
        };

        const images = Array.isArray(place.assets)
            ? place.assets
                  .map((a) => ({
                      id: a.id,
                      url: a.url,
                      is_primary: a.is_primary,
                  }))
                  .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)))
            : [];

        const locations = Array.isArray(place.locations)
            ? place.locations.map((l) => {
                  const locationReviews = Array.isArray(l.reviews) ? l.reviews : [];
                  const locationReviewCount = locationReviews.length;
                  const locationRatingAvg =
                      locationReviewCount === 0
                          ? null
                          : Number(
                                (
                                    locationReviews.reduce(
                                        (sum, review) => sum + Number(review.rating || 0),
                                        0
                                    ) / locationReviewCount
                                ).toFixed(2)
                            );

                  return {
                      id: l.id,
                      lat: toNumberOrNull(l.lat),
                      lng: toNumberOrNull(l.lng),
                      address: l.address,
                      review_count: locationReviewCount,
                      rating_avg: locationRatingAvg,
                      district: l.district
                          ? {
                                id: l.district.id,
                                name: l.district.name,
                            }
                          : null,
                  };
              })
            : [];

        const reviews = [];
        if (Array.isArray(place.locations)) {
            for (const loc of place.locations) {
                if (!Array.isArray(loc.reviews)) continue;

                for (const r of loc.reviews) {
                    const likedBy = Array.isArray(r.review_likes)
                        ? r.review_likes
                              .map((rl) => rl.user)
                              .filter(Boolean)
                              .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar }))
                        : [];

                    const uniqueLikedBy = Array.from(
                        new Map(likedBy.map((u) => [u.id, u])).values()
                    );

                    const reviewImages = Array.isArray(r.assets)
                        ? r.assets.map((a) => ({ id: a.id, url: a.url }))
                        : [];

                    reviews.push({
                        id: r.id,
                        rating: r.rating,
                        comment: r.comment,
                        created_at: r.created_at,
                        user: r.user
                            ? {
                                  id: r.user.id,
                                  username: r.user.username,
                                  avatar: r.user.avatar,
                              }
                            : null,
                        like_count: uniqueLikedBy.length,
                        liked_by: uniqueLikedBy,
                        images: reviewImages,
                        location: {
                            id: loc.id,
                            lat: toNumberOrNull(loc.lat),
                            lng: toNumberOrNull(loc.lng),
                            address: loc.address,
                        },
                    });
                }
            }
        }

        const reviewCount = reviews.length;
        const ratingAvg =
            reviewCount === 0
                ? null
                : Number(
                      (
                          reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
                          reviewCount
                      ).toFixed(2)
                  );

        return {
            id: place.id,
            name: place.name,
            description: place.description,
            category: place.category
                ? {
                      id: place.category.id,
                      name: place.category.name,
                      icon_marker: place.category.icon_marker,
                  }
                : null,
            images,
            locations,
            review_count: reviewCount,
            rating_avg: ratingAvg,
            reviews: reviews.sort(
                (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
            ),
        };
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
                    model: db.Location,
                    as: 'locations',
                    attributes: ['id', 'lat', 'lng', 'address', 'district_id'],
                    required: false,
                    include: [
                        {
                            model: db.District,
                            as: 'district',
                            attributes: ['id', 'name'],
                            required: false,
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

        return this.buildPlaceDetailResponse(place);
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
                    attributes: ['id', 'lat', 'lng', 'address', 'district_id'],
                    required: false,
                    include: [
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
