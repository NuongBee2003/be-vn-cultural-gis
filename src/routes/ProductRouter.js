const express = require('express');
const router = express.Router();
const productManager = require('../manager/productManager');
const { requireAuth, requireRole } = require('../middleware');

/**
 * @openapi
 * /api/v1/product:
 *   get:
 *     tags:
 *       - Product
 *     summary: Lấy danh sách sản phẩm
 *     description: Lấy danh sách tất cả sản phẩm, hỗ trợ phân trang và tìm kiếm.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số sản phẩm tối đa mỗi trang
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên sản phẩm
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Lọc sản phẩm của một Business/User cụ thể
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/', productManager.getAll);

/**
 * @openapi
 * /api/v1/product/{id}:
 *   get:
 *     tags:
 *       - Product
 *     summary: Chi tiết sản phẩm
 *     description: Lấy thông tin chi tiết một sản phẩm theo ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID sản phẩm
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', productManager.getDetail);

/**
 * @openapi
 * /api/v1/product:
 *   post:
 *     tags:
 *       - Product
 *     summary: Đăng sản phẩm mới (Business / Admin)
 *     description: Đăng một sản phẩm mới, kiểm tra giới hạn gói subscription của Business.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image_url:
 *                 type: string
 *               affiliate_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đăng sản phẩm thành công
 *       400:
 *         description: Thiếu dữ liệu bắt buộc
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Vượt quá giới hạn gói hoặc không có quyền
 */
router.post('/', requireAuth, requireRole('admin'), productManager.create);

/**
 * @openapi
 * /api/v1/product/{id}:
 *   put:
 *     tags:
 *       - Product
 *     summary: Cập nhật sản phẩm (Business / Admin)
 *     description: Cập nhật sản phẩm của chính mình hoặc quyền Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image_url:
 *                 type: string
 *               affiliate_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Không có quyền sửa
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put('/:id', requireAuth, requireRole('admin'), productManager.update);

/**
 * @openapi
 * /api/v1/product/{id}:
 *   delete:
 *     tags:
 *       - Product
 *     summary: Xóa sản phẩm (Business / Admin)
 *     description: Xóa sản phẩm của chính mình hoặc quyền Admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       403:
 *         description: Không có quyền xóa
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.delete('/:id', requireAuth, requireRole('admin'), productManager.delete);

module.exports = router;
