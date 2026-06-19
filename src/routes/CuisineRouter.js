const express = require('express');
const route = express.Router();
const cuisineManager = require('../manager/cuisineManager');
const { requireAuth } = require('../middleware');

/**
 * @openapi
 * /api/v1/cuisine:
 *   get:
 *     tags:
 *       - Cuisine
 *     summary: Lấy danh sách món ăn/ẩm thực
 *     description: Trả về danh sách tất cả các món ăn truyền thống đặc sản Việt Nam.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuisineListResponse'
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/', cuisineManager.getAll);

/**
 * @openapi
 * /api/v1/cuisine/{id}:
 *   get:
 *     tags:
 *       - Cuisine
 *     summary: Lấy chi tiết món ăn ẩm thực
 *     description: Trả về thông tin chi tiết của một món ăn đặc sản theo ID, bao gồm cả các gợi ý địa điểm bán món ăn này.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID món ăn
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuisineResponse'
 *       '404':
 *         description: Không tìm thấy món ăn
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/:id', cuisineManager.getDetail);

/**
 * @openapi
 * /api/v1/cuisine:
 *   post:
 *     tags:
 *       - Cuisine
 *     summary: Tạo món ăn mới
 *     description: Thêm một món ăn đặc trưng vào hệ thống cẩm nang ẩm thực. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CuisineCreateRequest'
 *     responses:
 *       '201':
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuisineResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/', requireAuth, cuisineManager.create);

/**
 * @openapi
 * /api/v1/cuisine/{id}:
 *   put:
 *     tags:
 *       - Cuisine
 *     summary: Cập nhật món ăn
 *     description: Sửa đổi thông tin món ăn ẩm thực. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID món ăn cần sửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CuisineUpdateRequest'
 *     responses:
 *       '200':
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CuisineResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy món ăn
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/:id', requireAuth, cuisineManager.update);

/**
 * @openapi
 * /api/v1/cuisine/{id}:
 *   delete:
 *     tags:
 *       - Cuisine
 *     summary: Xóa món ăn
 *     description: Gỡ bỏ món ăn ẩm thực khỏi hệ thống. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID món ăn cần xóa
 *     responses:
 *       '200':
 *         description: Xóa thành công
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy món ăn
 *       '500':
 *         description: Lỗi hệ thống
 */
route.delete('/:id', requireAuth, cuisineManager.delete);

/**
 * @openapi
 * /api/v1/cuisine/{id}/recommend:
 *   post:
 *     tags:
 *       - Cuisine
 *     summary: Gợi ý địa điểm bán món ăn này
 *     description: Gắn liên kết gợi ý địa điểm bán món ăn đặc sản này. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID món ăn cần gắn gợi ý
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CuisinePlaceCreateRequest'
 *     responses:
 *       '201':
 *         description: Gắn thành công
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
 *                   example: Created
 *                 data:
 *                   type: object
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/:id/recommend', requireAuth, cuisineManager.addRecommendation);

/**
 * @openapi
 * /api/v1/cuisine/recommend/{recId}:
 *   delete:
 *     tags:
 *       - Cuisine
 *     summary: Gỡ gợi ý địa điểm bán món ăn
 *     description: Xóa liên kết gợi ý địa điểm bán món ăn bằng ID liên kết. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của liên kết CuisinePlace cần gỡ bỏ
 *     responses:
 *       '200':
 *         description: Gỡ bỏ thành công
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy liên kết
 *       '500':
 *         description: Lỗi hệ thống
 */
route.delete('/recommend/:recId', requireAuth, cuisineManager.removeRecommendation);

module.exports = route;
