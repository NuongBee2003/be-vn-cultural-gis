const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const HttpError = require('../utils/httpError');
const subscriptionController = require('../controller/SubscriptionController');

class SubscriptionManager {
    /**
     * GET /api/v1/subscription/my-active
     * Lấy thông tin gói đang hoạt động của user hiện tại
     */
    getMyActive = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Yêu cầu đăng nhập');
        }

        const result = await subscriptionController.getMyActive(userId);

        return sendSuccess(res, {
            statusCode: 200,
            message: result.is_default ? 'Bạn đang dùng gói mặc định (Free)' : 'OK',
            data: result,
        });
    });

    /**
     * GET /api/v1/subscription/my-history
     * Lấy lịch sử đăng ký gói của user hiện tại
     */
    getMyHistory = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Yêu cầu đăng nhập');
        }

        const subs = await subscriptionController.getMyHistory(userId);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'OK',
            data: subs,
        });
    });

    /**
     * GET /api/v1/subscription/admin/all
     * Admin - Xem lịch sử đăng ký gói toàn bộ user
     */
    getAllAdmin = asyncHandler(async (req, res) => {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const status = req.query.status;

        const { count, rows } = await subscriptionController.getAllAdmin({
            page,
            limit,
            statusFilter: status
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
    });

    /**
     * POST /api/v1/subscription/subscribe
     * Đăng ký mua gói dịch vụ
     */
    subscribe = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Yêu cầu đăng nhập');
        }

        const { packageId, businessName, businessPhone } = req.body;
        if (!packageId) {
            throw new HttpError(400, 'packageId là bắt buộc');
        }

        const ipAddr = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3002/api/v1/subscription/vnpay-return';

        const result = await subscriptionController.subscribe({
            userId,
            packageId,
            ipAddr,
            returnUrl,
            businessName,
            businessPhone
        });

        if (!result.isPaid) {
            return sendSuccess(res, {
                statusCode: 201,
                message: `Đăng ký gói "${result.packageName}" thành công!`,
                data: result.data,
            });
        } else {
            return sendSuccess(res, {
                statusCode: 201,
                message: 'Khởi tạo link thanh toán VNPAY thành công',
                data: {
                    subscriptionId: result.subscriptionId,
                    paymentUrl: result.paymentUrl
                }
            });
        }
    });

    /**
     * GET /api/v1/subscription/vnpay-return
     * Callback nhận kết quả thanh toán từ VNPAY và xử lý kích hoạt
     */
    vnpayReturn = asyncHandler(async (req, res) => {
        const result = await subscriptionController.vnpayReturn(req.query);
        const frontendUrl = process.env.VITE_URL || 'http://localhost:5173/';

        if (!result.isValid) {
            // eslint-disable-next-line no-console
            console.error('VNPAY Signature Verification Failed');
            return res.redirect(`${frontendUrl}payment-result?status=fail&message=${result.message}`);
        }

        if (result.status === 'success') {
            // eslint-disable-next-line no-console
            console.log(`Activated sub ${result.subscriptionId} and upgraded user ${result.userId} to business`);
            return res.redirect(`${frontendUrl}payment-result?status=success`);
        } else {
            // eslint-disable-next-line no-console
            console.log(`VNPAY transaction failed`);
            if (result.message) {
                return res.redirect(`${frontendUrl}payment-result?status=fail&message=${result.message}`);
            } else {
                return res.redirect(`${frontendUrl}payment-result?status=fail&code=${result.code}`);
            }
        }
    });

    /**
     * POST /api/v1/subscription/cancel
     * Hủy gói dịch vụ đang active
     */
    cancel = asyncHandler(async (req, res) => {
        const userId = req.userId;
        if (!userId) {
            throw new HttpError(401, 'Yêu cầu đăng nhập');
        }

        await subscriptionController.cancel(userId);

        return sendSuccess(res, {
            statusCode: 200,
            message: 'Hủy gói thành công',
        });
    });
}

module.exports = new SubscriptionManager();
