const express = require('express');
const route = express.Router();
const notificationManager = require('../manager/notificationManager');
const { requireAuth } = require('../middleware');

/**
 * @openapi
 * /api/v1/notification:
 *   get:
 *     tags:
 *       - Notification
 *     summary: Lấy danh sách thông báo của người dùng
 *     description: Trả về toàn bộ các thông báo (notifications) của người dùng hiện tại, bao gồm thông tin chi tiết về người tương tác (actor), bài viết liên quan (post), bình luận liên quan (comment). Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationListResponse'
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/', requireAuth, notificationManager.getByUser);

/**
 * @openapi
 * /api/v1/notification/read-all:
 *   put:
 *     tags:
 *       - Notification
 *     summary: Đánh dấu tất cả thông báo là đã đọc
 *     description: Cập nhật tất cả các thông báo chưa đọc của người dùng hiện tại thành đã đọc (`is_read = true`). Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Đánh dấu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/read-all', requireAuth, notificationManager.markAllRead);

/**
 * @openapi
 * /api/v1/notification/{id}/read:
 *   put:
 *     tags:
 *       - Notification
 *     summary: Đánh dấu một thông báo là đã đọc
 *     description: Cập nhật trạng thái một thông báo cụ thể thành đã đọc (`is_read = true`). Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID thông báo cần đánh dấu
 *     responses:
 *       '200':
 *         description: Đánh dấu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy thông báo
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/:id/read', requireAuth, notificationManager.markRead);

module.exports = route;
