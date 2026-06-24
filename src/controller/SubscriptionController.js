const db = require('../models');
const { Op } = require('sequelize');

class SubscriptionController {
    /**
     * Hàm nội bộ: lấy gói đang active của user (dùng chung)
     * Nếu không có gói active, trả về null
     */
    async getActiveSubscription(userId) {
        const now = new Date();

        return db.UserSubscription.findOne({
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
    }

    /**
     * Lấy thông tin gói đang hoạt động của user hiện tại
     */
    async getMyActive(userId) {
        const sub = await this.getActiveSubscription(userId);

        if (!sub) {
            // Không có gói, trả về thông tin mặc định Free
            const freePkg = await db.Package.findOne({
                where: { price: 0.00 },
                order: [['max_places', 'ASC']],
            });

            return {
                subscription: null,
                package: freePkg || { name: 'Free', max_places: 3, price: 0 },
                is_default: true,
            };
        }

        return {
            subscription: sub,
            package: sub.package,
            is_default: false,
        };
    }

    /**
     * Đăng ký mua gói dịch vụ
     */
    async subscribe({ userId, packageId, ipAddr, returnUrl, businessName = null, businessPhone = null }) {
        const transaction = await db.sequelize.transaction();
        try {
            const pkg = await db.Package.findByPk(packageId);
            if (!pkg) {
                const err = new Error('Không tìm thấy gói dịch vụ');
                err.statusCode = 404;
                throw err;
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
                    created_at: startDate,
                    updated_at: startDate
                }, { transaction });

                // Nâng cấp role của user thành 'business' và lưu thông tin doanh nghiệp
                await db.User.update(
                    {
                        role: 'business',
                        business_name: businessName || null,
                        business_phone: businessPhone || null
                    },
                    { where: { id: userId }, transaction }
                );

                await transaction.commit();

                const result = await db.UserSubscription.findByPk(newSub.id, {
                    include: [{
                        model: db.Package,
                        as: 'package',
                        attributes: ['id', 'name', 'max_places', 'price', 'duration_days'],
                    }],
                });

                return {
                    isPaid: false,
                    packageName: pkg.name,
                    data: result,
                };
            } else {
                // Lưu trước thông tin doanh nghiệp
                await db.User.update(
                    {
                        business_name: businessName || null,
                        business_phone: businessPhone || null
                    },
                    { where: { id: userId }, transaction }
                );

                const newSub = await db.UserSubscription.create({
                    user_id: userId,
                    package_id: pkg.id,
                    start_date: startDate,
                    end_date: endDate,
                    status: 'pending',
                    created_at: startDate,
                    updated_at: startDate
                }, { transaction });

                await transaction.commit();

                const { createPaymentUrl } = require('../utils/vnpay');

                // Trực tiếp dùng id của subscription làm vnp_TxnRef
                const paymentUrl = createPaymentUrl({
                    amount: pkg.price,
                    txnRef: String(newSub.id),
                    orderInfo: `Thanh toan dang ky goi ${pkg.name}`,
                    ipAddr: ipAddr || '127.0.0.1',
                    returnUrl: returnUrl
                });

                return {
                    isPaid: true,
                    subscriptionId: newSub.id,
                    paymentUrl
                };
            }
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Callback nhận kết quả thanh toán từ VNPAY và xử lý kích hoạt
     */
    async vnpayReturn(queryParams) {
        const { verifyReturnUrl } = require('../utils/vnpay');
        const isValid = verifyReturnUrl({ ...queryParams });

        if (!isValid) {
            return {
                isValid: false,
                message: 'signature_failed'
            };
        }

        const responseCode = queryParams['vnp_ResponseCode'];
        const transactionStatus = queryParams['vnp_TransactionStatus'];
        const subId = queryParams['vnp_TxnRef'];

        if (responseCode === '00' && transactionStatus === '00') {
            const transaction = await db.sequelize.transaction();
            try {
                const sub = await db.UserSubscription.findByPk(subId, { transaction });
                if (!sub) {
                    await transaction.rollback();
                    return {
                        isValid: true,
                        status: 'fail',
                        message: 'subscription_not_found'
                    };
                }

                if (sub.status === 'active') {
                    await transaction.commit();
                    return {
                        isValid: true,
                        status: 'success'
                    };
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
                return {
                    isValid: true,
                    status: 'success',
                    userId: sub.user_id,
                    subscriptionId: subId
                };
            } catch (err) {
                if (!transaction.finished) {
                    await transaction.rollback();
                }
                throw err;
            }
        } else {
            try {
                await db.UserSubscription.update(
                    { status: 'cancelled', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
                    { where: { id: subId } }
                );
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Error cancelling subscription in DB:', e);
            }
            return {
                isValid: true,
                status: 'fail',
                code: responseCode
            };
        }
    }

    /**
     * Hủy gói đang active
     */
    async cancel(userId) {
        const updated = await db.UserSubscription.update(
            { status: 'cancelled', updated_at: db.sequelize.literal('CURRENT_TIMESTAMP(3)') },
            { where: { user_id: userId, status: 'active' } }
        );

        if (updated[0] === 0) {
            const err = new Error('Không có gói nào đang hoạt động để hủy');
            err.statusCode = 404;
            throw err;
        }

        return { success: true };
    }

    /**
     * Admin: xem toàn bộ lịch sử đăng ký gói của tất cả user
     */
    async getAllAdmin({ page, limit, statusFilter }) {
        const offset = (page - 1) * limit;
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

        return {
            count,
            rows
        };
    }

    /**
     * Lấy lịch sử đăng ký gói của user hiện tại
     */
    async getMyHistory(userId) {
        return db.UserSubscription.findAll({
            where: { user_id: userId },
            include: [{
                model: db.Package,
                as: 'package',
                attributes: ['id', 'name', 'max_places', 'price'],
            }],
            order: [['created_at', 'DESC']],
        });
    }
}

module.exports = new SubscriptionController();
