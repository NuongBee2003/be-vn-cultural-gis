const express = require('express');
const route = express.Router();

const ExhibitionManager = require('../manager/ExhibitionManager');
const { requireAuth, requireRole, optionalAuth } = require('../middleware');

/**
 * @openapi
 * /api/v1/exhibition:
 *   get:
 *     tags:
 *       - Exhibition
 *     summary: Lấy danh sách triển lãm ảo đã duyệt
 *     description: Trả về danh sách tác phẩm triển lãm đã duyệt. Nếu có gửi kèm token thì trả về thêm các tác phẩm do chính người dùng đó đã tải lên (ở trạng thái pending/rejected).
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [place, food, festival]
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Lọc theo tỉnh thành
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionListResponse'
 *       '500':
 *         description: Lỗi hệ thống
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/', optionalAuth, ExhibitionManager.getAll);

/**
 * @openapi
 * /api/v1/exhibition/admin:
 *   get:
 *     tags:
 *       - Exhibition
 *     summary: Lấy tất cả danh sách triển lãm ảo (dành cho Admin)
 *     description: Lấy danh sách toàn bộ các tác phẩm triển lãm phục vụ công tác kiểm duyệt. Yêu cầu quyền Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Lọc theo trạng thái kiểm duyệt
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [place, food, festival]
 *         description: Lọc theo danh mục
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionListResponse'
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '403':
 *         description: Không có quyền truy cập
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/admin', requireAuth, requireRole('admin'), ExhibitionManager.getAllAdmin);

/**
 * @openapi
 * /api/v1/exhibition/{id}:
 *   get:
 *     tags:
 *       - Exhibition
 *     summary: Lấy chi tiết tác phẩm triển lãm
 *     description: Trả về thông tin chi tiết của một tác phẩm triển lãm ảo bằng ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tác phẩm triển lãm
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionResponse'
 *       '404':
 *         description: Không tìm thấy tác phẩm
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/:id', optionalAuth, ExhibitionManager.getDetail);

/**
 * @openapi
 * /api/v1/exhibition:
 *   post:
 *     tags:
 *       - Exhibition
 *     summary: Tạo tác phẩm triển lãm ảo mới
 *     description: Đăng tác phẩm triển lãm ảo mới lên hệ thống. Đăng ảnh lên Supabase bucket `exhibition_images` trước rồi truyền url vào request body. Người dùng thường tạo sẽ có trạng thái `pending`, Admin tạo sẽ tự động `accepted`.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExhibitionCreateRequest'
 *     responses:
 *       '201':
 *         description: Đăng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionResponse'
 *       '400':
 *         description: Dữ liệu đầu vào không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/', requireAuth, ExhibitionManager.create);

/**
 * @openapi
 * /api/v1/exhibition/{id}:
 *   put:
 *     tags:
 *       - Exhibition
 *     summary: Chỉnh sửa tác phẩm triển lãm ảo
 *     description: Cập nhật thông tin tác phẩm triển lãm ảo. Yêu cầu là người sở hữu tác phẩm hoặc Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tác phẩm triển lãm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExhibitionUpdateRequest'
 *     responses:
 *       '200':
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '403':
 *         description: Không có quyền chỉnh sửa tác phẩm này
 *       '404':
 *         description: Không tìm thấy tác phẩm
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/:id', requireAuth, ExhibitionManager.update);

/**
 * @openapi
 * /api/v1/exhibition/{id}:
 *   delete:
 *     tags:
 *       - Exhibition
 *     summary: Xóa tác phẩm triển lãm ảo
 *     description: Xóa tác phẩm triển lãm ảo khỏi hệ thống. Yêu cầu là người sở hữu hoặc Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tác phẩm triển lãm cần xóa
 *     responses:
 *       '200':
 *         description: Xóa thành công
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '403':
 *         description: Không có quyền xóa tác phẩm này
 *       '404':
 *         description: Không tìm thấy tác phẩm
 *       '500':
 *         description: Lỗi hệ thống
 */
route.delete('/:id', requireAuth, ExhibitionManager.delete);

/**
 * @openapi
 * /api/v1/exhibition/{id}/review:
 *   post:
 *     tags:
 *       - Exhibition
 *     summary: Phê duyệt/từ chối triển lãm ảo (Admin)
 *     description: Thay đổi trạng thái duyệt tác phẩm triển lãm ảo ('accepted' hoặc 'rejected'). Yêu cầu quyền Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tác phẩm triển lãm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExhibitionReviewRequest'
 *     responses:
 *       '200':
 *         description: Duyệt thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExhibitionResponse'
 *       '400':
 *         description: Trạng thái không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '403':
 *         description: Không có quyền Admin
 *       '404':
 *         description: Không tìm thấy tác phẩm
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/:id/review', requireAuth, requireRole('admin'), ExhibitionManager.review);

/**
 * @openapi
 * /api/v1/exhibition/{id}/like:
 *   post:
 *     tags:
 *       - Exhibition
 *     summary: Thích hoặc Bỏ thích tác phẩm triển lãm ảo
 *     description: Tăng hoặc giảm số lượt thích của tác phẩm triển lãm ảo.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID tác phẩm triển lãm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExhibitionLikeRequest'
 *     responses:
 *       '200':
 *         description: Thành công
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     likes:
 *                       type: integer
 *                       example: 43
 *       '400':
 *         description: Action không hợp lệ
 *       '404':
 *         description: Không tìm thấy tác phẩm
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/:id/like', ExhibitionManager.toggleLike);

module.exports = route;
