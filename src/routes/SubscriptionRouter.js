const express = require('express');
const route = express.Router();
const subscriptionManager = require('../manager/subscriptionManager');
const { requireAuth, requireRole } = require('../middleware');

/**
 * @openapi
 * /api/v1/subscription/my-active:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Lấy gói đang hoạt động của tôi
 *     description: |
 *       Trả về thông tin gói dịch vụ đang active của user hiện tại.
 *
 *       **Logic xử lý:**
 *       - Nếu user có gói `active` và chưa hết hạn → trả về gói đó.
 *       - Nếu user **chưa đăng ký gói nào** hoặc tất cả đã hết hạn → trả về gói mặc định Free
 *         với `is_default: true` và `subscription: null`.
 *
 *       Dùng API này để kiểm tra user còn được đăng bao nhiêu địa điểm.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin gói đang hoạt động
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionActiveResponse'
 *             examples:
 *               has_subscription:
 *                 summary: User đang dùng gói Standard
 *                 value:
 *                   success: true
 *                   message: OK
 *                   data:
 *                     subscription:
 *                       id: 5
 *                       user_id: 12
 *                       package_id: 2
 *                       start_date: "2026-06-23T10:00:00.000Z"
 *                       end_date: "2026-07-23T10:00:00.000Z"
 *                       status: active
 *                       package:
 *                         id: 2
 *                         name: Standard
 *                         max_places: 10
 *                         price: 99000
 *                         duration_days: 30
 *                     package:
 *                       id: 2
 *                       name: Standard
 *                       max_places: 10
 *                     is_default: false
 *               no_subscription:
 *                 summary: User chưa đăng ký (dùng gói Free mặc định)
 *                 value:
 *                   success: true
 *                   message: Bạn đang dùng gói mặc định (Free)
 *                   data:
 *                     subscription: null
 *                     package:
 *                       name: Free
 *                       max_places: 3
 *                       price: 0
 *                     is_default: true
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/my-active', requireAuth, subscriptionManager.getMyActive);

/**
 * @openapi
 * /api/v1/subscription/my-history:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Lịch sử đăng ký gói của tôi
 *     description: |
 *       Trả về toàn bộ lịch sử đăng ký gói dịch vụ của user hiện tại,
 *       bao gồm cả các gói đã hết hạn (`expired`) và đã hủy (`cancelled`).
 *       Dùng để hiển thị màn hình "Lịch sử mua gói" trong app.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử đăng ký gói
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: OK }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionData'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/my-history', requireAuth, subscriptionManager.getMyHistory);

/**
 * @openapi
 * /api/v1/subscription/admin/all:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Admin - Xem lịch sử đăng ký gói toàn bộ user
 *     description: |
 *       Cho phép Admin xem toàn bộ lịch sử đăng ký gói của tất cả người dùng.
 *       Có thể lọc theo `status` và phân trang.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Trang hiện tại (bắt đầu từ 1)
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         description: Số bản ghi mỗi trang (tối đa 100)
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *           example: 20
 *       - in: query
 *         name: status
 *         description: Lọc theo trạng thái gói
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled]
 *           example: active
 *     responses:
 *       200:
 *         description: Danh sách subscription phân trang
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionListResponse'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Không có quyền Admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/admin/all', requireAuth, requireRole('admin'), subscriptionManager.getAllAdmin);

/**
 * @openapi
 * /api/v1/subscription/subscribe:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Đăng ký mua gói dịch vụ
 *     description: |
 *       Cho phép user đăng ký hoặc chuyển sang một gói dịch vụ mới.
 *
 *       **Luồng xử lý:**
 *       1. Tìm gói theo `packageId`.
 *       2. Tự động chuyển trạng thái tất cả gói `active` hiện tại của user sang `expired`.
 *       3. Tạo bản ghi mới với `status: active`, tính `end_date = now + duration_days`.
 *
 *       **Ứng dụng:** Dùng khi user bấm "Mua gói" hoặc "Nâng cấp" trong UI.
 *       Đối với gói Free (price = 0), cũng gọi API này để user được ghi nhận gói Free chính thức.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscribeRequest'
 *           examples:
 *             subscribe_free:
 *               summary: Đăng ký gói Free (id=1)
 *               value:
 *                 packageId: 1
 *             subscribe_standard:
 *               summary: Mua gói Standard (id=2)
 *               value:
 *                 packageId: 2
 *     responses:
 *       201:
 *         description: Đăng ký gói thành công, trả về thông tin subscription mới
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubscriptionResponse'
 *       400:
 *         description: Thiếu packageId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Chưa đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy gói dịch vụ theo packageId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.post('/subscribe', requireAuth, subscriptionManager.subscribe);


/**
 * @openapi
 * /api/v1/subscription/vnpay-return:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Nhận phản hồi thanh toán từ VNPAY (Callback)
 *     description: Endpoint này nhận các query parameters từ VNPAY chuyển hướng về, xác thực và kích hoạt gói nếu thành công.
 *     responses:
 *       302:
 *         description: Redirect về màn hình kết quả trên Frontend
 */
route.get('/vnpay-return', subscriptionManager.vnpayReturn);

module.exports = route;
