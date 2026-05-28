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

                if (locations !== undefined) {
                    const placeWithLocations = await placeController.getPlaceWithLocations(createdPlace.id);
                    return res.status(201).json(placeWithLocations);
                }

                return res.status(201).json(createdPlace);
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
}

module.exports = new PlaceManager();
