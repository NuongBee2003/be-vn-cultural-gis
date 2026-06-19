const express = require('express');
const route = express.Router();
const customManager = require('../manager/customManager');
const { requireAuth } = require('../middleware');

/**
 * @openapi
 * /api/v1/custom:
 *   get:
 *     tags:
 *       - Custom
 *     summary: Lấy danh sách phong tục tập quán/lễ hội
 *     description: Trả về danh sách tất cả các phong tục tập quán, tín ngưỡng và lễ hội truyền thống Việt Nam.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomListResponse'
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/', customManager.getAll);

/**
 * @openapi
 * /api/v1/custom/{id}:
 *   get:
 *     tags:
 *       - Custom
 *     summary: Lấy chi tiết phong tục tập quán
 *     description: Trả về thông tin chi tiết của một phong tục tập quán/lễ hội bằng ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phong tục/lễ hội
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomResponse'
 *       '404':
 *         description: Không tìm thấy phong tục tập quán
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/:id', customManager.getDetail);

/**
 * @openapi
 * /api/v1/custom:
 *   post:
 *     tags:
 *       - Custom
 *     summary: Tạo phong tục tập quán mới
 *     description: Thêm một phong tục tập quán/lễ hội mới vào hệ thống. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomCreateRequest'
 *     responses:
 *       '201':
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/', requireAuth, customManager.create);

/**
 * @openapi
 * /api/v1/custom/{id}:
 *   put:
 *     tags:
 *       - Custom
 *     summary: Cập nhật phong tục tập quán
 *     description: Sửa đổi thông tin phong tục tập quán/lễ hội. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phong tục cần sửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomUpdateRequest'
 *     responses:
 *       '200':
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy phong tục tập quán này
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/:id', requireAuth, customManager.update);

/**
 * @openapi
 * /api/v1/custom/{id}:
 *   delete:
 *     tags:
 *       - Custom
 *     summary: Xóa phong tục tập quán
 *     description: Gỡ bỏ phong tục tập quán/lễ hội khỏi hệ thống. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID phong tục cần xóa
 *     responses:
 *       '200':
 *         description: Xóa thành công
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy phong tục tập quán này
 *       '500':
 *         description: Lỗi hệ thống
 */
route.delete('/:id', requireAuth, customManager.delete);

module.exports = route;
