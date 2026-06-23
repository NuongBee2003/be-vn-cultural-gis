const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { Op } = require('sequelize');

class SubscriptionController {
    /**
     * Hàm nội bộ: lấy gói đang active của user (dùng chung)
     * Nếu không có gói active, trả về gói Free (max_places = 3)
     */
    async _getActiveSubscription(userId) {
        const now = new Date();

        const sub = await db.UserSubscription.findOne({
            where: {
                user_id: userId,
                status: 'active',
                [Op.or]: [
                    { end_date: null },
                    { end_date: { [Op.gt]: now } },
                ],
            },
            include: [{
                model: db.Package,
                as: 'package',
                attributes: ['id', 'name', 'max_places', 'price', 'duration_days'],
            }],
            order: [['created_at', 'DESC']],
        });

        return sub;
    }

    /**
     * GET /api/v1/subscription/my-active
     * Lấy thông tin gói đang hoạt động của user hiện tại
     */
    async getMyActive(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return sendError(res, 401, 'Yêu cầu đăng nhập');
            }

            const sub = await this._getActiveSubscription(userId);

            if (!sub) {
                // Không có gói, trả về thông tin mặc định Free
                const freePkg = await db.Package.findOne({
                    where: { price: 0.00 },
                    order: [['max_places', 'ASC']],
                });

                return sendSuccess(res, {
                    statusCode: 200,
                    message: 'Bạn đang dùng gói mặc định (Free)',
                    data: {
                        subscription: null,
                        package: freePkg || { name: 'Free', max_places: 3, price: 0 },
                        is_default: true,
                    },
                });
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: {
                    subscription: sub,
                    package: sub.package,
                    is_default: false,
                },
            });
        } catch (error) {
            console.error('Lỗi khi lấy gói active:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * POST /api/v1/subscription/subscribe
     * Đăng ký / mua một gói mới
     * Body: { packageId }
     */
    async subscribe(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const userId = req.userId;
            if (!userId) {
                await transaction.rollback();
                return sendError(res, 401, 'Yêu cầu đăng nhập');
            }

            const { packageId } = req.body;
            if (!packageId) {
                await transaction.rollback();
                return sendError(res, 400, 'packageId là bắt buộc');
            }

            const pkg = await db.Package.findByPk(packageId);
            if (!pkg) {
                await transaction.rollback();
                return sendError(res, 404, 'Không tìm thấy gói dịch vụ');
            }

            // Hủy tất cả gói active hiện tại của user
            await db.UserSubscription.update(
                { status: 'expired', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                {
                    where: { user_id: userId, status: 'active' },
                    transaction,
                }
            );

            // Tính ngày hết hạn
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + pkg.duration_days);

            // Tạo subscription mới
            const newSub = await db.UserSubscription.create({
                user_id: userId,
                package_id: pkg.id,
                start_date: startDate,
                end_date: endDate,
                status: 'active',
            }, { transaction });

            await transaction.commit();

            // Trả về subscription kèm package
            const result = await db.UserSubscription.findByPk(newSub.id, {
                include: [{
                    model: db.Package,
                    as: 'package',
                    attributes: ['id', 'name', 'max_places', 'price', 'duration_days'],
                }],
            });

            return sendSuccess(res, {
                statusCode: 201,
                message: `Đăng ký gói "${pkg.name}" thành công!`,
                data: result,
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lỗi khi đăng ký gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * POST /api/v1/subscription/cancel
     * Hủy gói đang active
     */
    async cancel(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return sendError(res, 401, 'Yêu cầu đăng nhập');
            }

            const updated = await db.UserSubscription.update(
                { status: 'cancelled', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                { where: { user_id: userId, status: 'active' } }
            );

            if (updated[0] === 0) {
                return sendError(res, 404, 'Không có gói nào đang hoạt động để hủy');
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Hủy gói thành công',
            });
        } catch (error) {
            console.error('Lỗi khi hủy gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * GET /api/v1/subscription/admin/all
     * Admin: xem toàn bộ lịch sử đăng ký gói của tất cả user
     */
    async getAllAdmin(req, res) {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
            const offset = (page - 1) * limit;

            const statusFilter = req.query.status; // 'active' | 'expired' | 'cancelled'

            const where = {};
            if (statusFilter && ['active', 'expired', 'cancelled'].includes(statusFilter)) {
                where.status = statusFilter;
            }

            const { count, rows } = await db.UserSubscription.findAndCountAll({
                where,
                include: [
                    {
                        model: db.User,
                        as: 'user',
                        attributes: ['id', 'username', 'email', 'role'],
                    },
                    {
                        model: db.Package,
                        as: 'package',
                        attributes: ['id', 'name', 'max_places', 'price'],
                    },
                ],
                order: [['created_at', 'DESC']],
                limit,
                offset,
                distinct: true,
            });

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: rows,
                meta: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit),
                },
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách subscription:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * GET /api/v1/subscription/my-history
     * Lấy lịch sử đăng ký gói của user hiện tại
     */
    async getMyHistory(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return sendError(res, 401, 'Yêu cầu đăng nhập');
            }

            const subs = await db.UserSubscription.findAll({
                where: { user_id: userId },
                include: [{
                    model: db.Package,
                    as: 'package',
                    attributes: ['id', 'name', 'max_places', 'price'],
                }],
                order: [['created_at', 'DESC']],
            });

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: subs,
            });
        } catch (error) {
            console.error('Lỗi khi lấy lịch sử gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }
}

module.exports = new SubscriptionController();
