const placeController = require('../controller/PlaceController');
const locationController = require('../controller/LocationController');
const transactionController = require('../controller/TransactionController');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/apiResponse');

class PlaceManager {
    async getAllPlaces(req, res) {
        try {
            const places = await placeController.getAllPlaces();
            return res.status(200).json(places);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getDetail(req, res) {
        try {
            const place = await placeController.getPlaceDetail(req.params.id);
            return res.status(200).json(place);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async create(req, res) {
        try {
            const { locations } = req.body || {};

            let transaction;
            try {
                transaction = await transactionController.begin();

                const createdPlace = await 
                placeController.createPlace(req.body, { transaction });

                if (locations !== undefined) {
                    if (!Array.isArray(locations)) {
                        const err = new Error('locations must be an array');
                        err.statusCode = 400;
                        throw err;
                    }

                    for (const loc of locations) {
                        await locationController.createLocation(
                            {
                                ...loc,
                                place_id: createdPlace.id,
                            },
                            { transaction }
                        );
                    }
                }

                await transactionController.commit(transaction);

                const placeWithLocations = await placeController.getPlaceWithLocations(createdPlace.id);
                return res.status(201).json(placeWithLocations);
            } catch (err) {
                if (transaction) {
                    try {
                        await transactionController.rollback(transaction);
                    } catch (rollbackErr) {
                        // eslint-disable-next-line no-console
                        console.log('ERROR: ' + rollbackErr);
                    }
                }
                throw err;
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async update(req, res) {
        try {
            const place = await placeController.updatePlace(req.params.id, req.body);
            return res.status(200).json(place);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async delete(req, res) {
        try {
            const deleted = await placeController.deletePlace(req.params.id);
            return res.status(200).json({ message: 'Place deleted successfully' });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    createReview = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Authentication required');
        }

        const review = await placeController.createReviewForPlace(req.params.id, req.body, userId);

        return sendSuccess(res, {
            statusCode: 201,
            message: 'Created',
            data: review,
        });
    });

    deleteReview = asyncHandler(async (req, res) => {
        const db = require('../models');
        const reviewId = Number(req.params.reviewId);
        if (!Number.isInteger(reviewId) || reviewId <= 0) {
            throw new HttpError(400, 'reviewId phải là số nguyên dương');
        }

        const review = await db.Review.findByPk(reviewId);
        if (!review) {
            throw new HttpError(404, 'Review not found');
        }

        // Chỉ admin hoặc chủ review mới được xóa
        const role = String(req.user?.role || '').toUpperCase();
        const currentUserId = Number(req.user?.userId || req.user?.id || 0);
        const isOwner = currentUserId === Number(review.user_id);
        if (role !== 'ADMIN' && !isOwner) {
            throw new HttpError(403, 'Forbidden');
        }

        await review.destroy();

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Deleted',
            data: null,
        });
    });
}

module.exports = new PlaceManager();
