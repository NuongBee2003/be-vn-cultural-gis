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

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + pkg.duration_days);

            if (Number(pkg.price) === 0) {
                // Gói Free: kích hoạt ngay lập tức
                await db.UserSubscription.update(
                    { status: 'expired', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                    {
                        where: { user_id: userId, status: 'active' },
                        transaction,
                    }
                );

                const newSub = await db.UserSubscription.create({
                    user_id: userId,
                    package_id: pkg.id,
                    start_date: startDate,
                    end_date: endDate,
                    status: 'active',
                }, { transaction });

                await transaction.commit();

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
            } else {
                // Gói có phí: Tạo ở trạng thái pending và sinh URL VNPAY
                const newSub = await db.UserSubscription.create({
                    user_id: userId,
                    package_id: pkg.id,
                    start_date: startDate,
                    end_date: endDate,
                    status: 'pending',
                }, { transaction });

                await transaction.commit();

                const { createPaymentUrl } = require('../utils/vnpay');
                
                // Trực tiếp dùng id của subscription làm vnp_TxnRef
                const paymentUrl = createPaymentUrl({
                    amount: pkg.price,
                    txnRef: String(newSub.id),
                    orderInfo: `Thanh toan dang ky goi ${pkg.name}`,
                    ipAddr: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
                    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3002/api/v1/subscription/vnpay-return'
                });

                return sendSuccess(res, {
                    statusCode: 201,
                    message: 'Khởi tạo link thanh toán VNPAY thành công',
                    data: {
                        subscriptionId: newSub.id,
                        paymentUrl
                    }
                });
            }
        } catch (error) {
            await transaction.rollback();
            console.error('Lỗi khi đăng ký gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * GET /api/v1/subscription/vnpay-return
     * Callback nhận kết quả thanh toán từ VNPAY và xử lý kích hoạt
     */
    async vnpayReturn(req, res) {
        const { verifyReturnUrl } = require('../utils/vnpay');
        const vnp_Params = req.query;
        
        const isValid = verifyReturnUrl({ ...vnp_Params });
        const frontendUrl = process.env.VITE_URL || 'http://localhost:5173/';
        
        if (!isValid) {
            console.error('VNPAY Signature Verification Failed');
            return res.redirect(`${frontendUrl}business/payment-result?status=fail&message=signature_failed`);
        }
        
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const transactionStatus = vnp_Params['vnp_TransactionStatus'];
        const subId = vnp_Params['vnp_TxnRef'];
        
        if (responseCode === '00' && transactionStatus === '00') {
            const transaction = await db.sequelize.transaction();
            try {
                const sub = await db.UserSubscription.findByPk(subId, { transaction });
                if (!sub) {
                    await transaction.rollback();
                    console.error('Subscription not found for id:', subId);
                    return res.redirect(`${frontendUrl}business/payment-result?status=fail&message=subscription_not_found`);
                }
                
                if (sub.status === 'active') {
                    await transaction.commit();
                    return res.redirect(`${frontendUrl}business/payment-result?status=success`);
                }
                
                // 1. Hủy các gói active hiện tại của user này
                await db.UserSubscription.update(
                    { status: 'expired', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                    {
                        where: { user_id: sub.user_id, status: 'active' },
                        transaction
                    }
                );
                
                // 2. Kích hoạt subscription hiện tại
                sub.status = 'active';
                sub.updated_at = new Date();
                await sub.save({ transaction });
                
                // 3. Nâng cấp role của user thành 'business'
                await db.User.update(
                    { role: 'business' },
                    { where: { id: sub.user_id }, transaction }
                );
                
                await transaction.commit();
                console.log(`Activated sub ${subId} and upgraded user ${sub.user_id} to business`);
                return res.redirect(`${frontendUrl}business/payment-result?status=success`);
            } catch (err) {
                await transaction.rollback();
                console.error('Error executing subscription activation transaction:', err);
                return res.redirect(`${frontendUrl}business/payment-result?status=fail&message=internal_error`);
            }
        } else {
            console.log(`VNPAY transaction failed with responseCode: ${responseCode}`);
            try {
                await db.UserSubscription.update(
                    { status: 'cancelled', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                    { where: { id: subId } }
                );
            } catch (e) {
                console.error('Error cancelling subscription:', e);
            }
            return res.redirect(`${frontendUrl}business/payment-result?status=fail&code=${responseCode}`);
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
