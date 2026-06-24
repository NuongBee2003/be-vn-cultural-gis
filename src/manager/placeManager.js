const placeController = require('../controller/PlaceController');
const locationController = require('../controller/LocationController');
const transactionController = require('../controller/TransactionController');
const assetController = require('../controller/AssetController');
const asyncHandler = require('../utils/asyncHandler');
const HttpError = require('../utils/httpError');
const { sendSuccess } = require('../utils/apiResponse');
const db = require('../models');

class PlaceManager {
    async getAllPlaces(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
            const query = req.query.query || '';
            const userId = req.query.userId ? Number(req.query.userId) : null;

            const result = await placeController.getAllPlacesPaginated({ page, limit, categoryId, query, userId });
            const totalPages = Math.ceil(result.count / result.limit);

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: result.rows,
                meta: {
                    total: result.count,
                    count: result.rows.length,
                    page: result.page,
                    limit: result.limit,
                    totalPages: totalPages,
                },
            });
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
            const userId = req.userId;
            const userRole = String(req.user?.role || '').toLowerCase();
            const { locations } = req.body || {};

            if (!locations || !Array.isArray(locations) || locations.length === 0) {
                const err = new Error('Địa điểm phải có ít nhất 1 chi nhánh');
                err.statusCode = 400;
                throw err;
            }

            // Kiểm tra giới hạn số địa điểm (trừ admin)
            if (userRole !== 'admin' && userId) {
                const { Op } = require('sequelize');
                const now = new Date();

                // Tìm gói đang active của user
                const activeSub = await db.UserSubscription.findOne({
                    where: {
                        user_id: userId,
                        status: 'active',
                        [Op.or]: [
                            { end_date: null },
                            { end_date: { [Op.gt]: now } },
                        ],
                    },
                    include: [{ model: db.Package, as: 'package' }],
                    order: [['created_at', 'DESC']],
                });

                // Giới hạn mặc định nếu không có gói: 0 (Free)
                let maxPlaces = 0;
                let packageName = 'Free';

                if (activeSub && activeSub.package) {
                    maxPlaces = activeSub.package.max_places;
                    packageName = activeSub.package.name;
                } else {
                    // Lấy gói Free từ DB nếu có
                    const freePkg = await db.Package.findOne({
                        where: { price: 0.00 },
                        order: [['max_places', 'ASC']],
                    });
                    if (freePkg) {
                        maxPlaces = freePkg.max_places;
                        packageName = freePkg.name;
                    }
                }

                // Đếm số địa điểm user đã tạo
                const currentCount = await db.Place.count({ where: { user_id: userId } });

                if (currentCount >= maxPlaces) {
                    return res.status(403).json({
                        message: `Bạn đã đạt giới hạn đăng địa điểm của gói "${packageName}" (Tối đa: ${maxPlaces} địa điểm). Vui lòng nâng cấp gói để tiếp tục.`,
                        current_count: currentCount,
                        max_places: maxPlaces,
                        package_name: packageName,
                    });
                }
            }

            let transaction;
            try {
                transaction = await transactionController.begin();

                const createdPlace = await placeController.createPlace(
                    { ...req.body, user_id: userId || null },
                    { transaction }
                );

                for (const loc of locations) {
                    const createdLoc = await locationController.createLocation(
                        {
                            ...loc,
                            place_id: createdPlace.id,
                        },
                        { transaction }
                    );

                    if (loc.images && loc.images.length > 0) {
                        await assetController.createAssets(loc.images, { location_id: createdLoc.id }, { transaction });
                    }
                }

                await transactionController.commit(transaction);

                const placeWithLocations = await placeController.getPlaceDetail(createdPlace.id);
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
            const { locations } = req.body || {};
            const placeId = req.params.id;

            let transaction;
            try {
                transaction = await transactionController.begin();

                // 1. Cập nhật Place
                await placeController.updatePlace(placeId, req.body, { transaction });

                // 2. Cập nhật vi sai chi nhánh
                if (locations !== undefined) {
                    if (!Array.isArray(locations)) {
                        const err = new Error('locations must be an array');
                        err.statusCode = 400;
                        throw err;
                    }

                    if (locations.length === 0) {
                        const err = new Error('Địa điểm phải có ít nhất 1 chi nhánh');
                        err.statusCode = 400;
                        throw err;
                    }

                    const existingLocations = await db.Location.findAll({
                        where: { place_id: placeId },
                        transaction
                    });

                    const existingIds = existingLocations.map(l => l.id);
                    const incomingIds = locations.filter(l => l.id).map(l => Number(l.id));

                    // Xóa các chi nhánh bị bỏ
                    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
                    if (toDelete.length > 0) {
                        await db.Location.destroy({
                            where: { id: toDelete },
                            transaction
                        });
                    }

                    // Thêm mới hoặc cập nhật
                    for (const loc of locations) {
                        if (loc.id) {
                            const existingLoc = existingLocations.find(l => l.id === Number(loc.id));
                            if (existingLoc) {
                                await locationController.updateLocation(existingLoc, loc, { transaction });
                                if (loc.images !== undefined) {
                                    await assetController.replaceAssets(loc.images, { location_id: existingLoc.id }, { transaction });
                                }
                            }
                        } else {
                            const newLoc = await locationController.createLocation(
                                {
                                    ...loc,
                                    place_id: placeId,
                                },
                                { transaction }
                            );
                            if (loc.images && loc.images.length > 0) {
                                await assetController.createAssets(loc.images, { location_id: newLoc.id }, { transaction });
                            }
                        }
                    }
                }

                await transactionController.commit(transaction);

                const updatedPlace = await placeController.getPlaceDetail(placeId);
                return res.status(200).json(updatedPlace);
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
