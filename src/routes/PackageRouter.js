const express = require('express');
const route = express.Router();
const packageManager = require('../manager/packageManager');
const { requireAuth, requireRole } = require('../middleware');

/**
 * @openapi
 * /api/v1/package:
 *   get:
 *     tags:
 *       - Package
 *     summary: Lấy danh sách tất cả gói dịch vụ
 *     description: |
 *       Trả về toàn bộ các gói dịch vụ (Free, Standard, Premium...) được sắp xếp theo giá tăng dần.
 *       API này **không yêu cầu đăng nhập**, dùng để hiển thị trang mua gói cho người dùng.
 *     responses:
 *       200:
 *         description: Danh sách gói dịch vụ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageListResponse'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/', packageManager.getAllPackages);

/**
 * @openapi
 * /api/v1/package/{id}:
 *   get:
 *     tags:
 *       - Package
 *     summary: Lấy chi tiết một gói dịch vụ
 *     description: |
 *       Trả về thông tin chi tiết của một gói dịch vụ theo ID.
 *       API này **không yêu cầu đăng nhập**.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của gói dịch vụ
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *     responses:
 *       200:
 *         description: Thông tin chi tiết gói dịch vụ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageResponse'
 *       404:
 *         description: Không tìm thấy gói dịch vụ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/:id', packageManager.getPackageById);

/**
 * @openapi
 * /api/v1/package:
 *   post:
 *     tags:
 *       - Package
 *     summary: Tạo gói dịch vụ mới (Admin only)
 *     description: |
 *       Cho phép Admin tạo một gói dịch vụ mới với các thông tin:
 *       - **name**: Tên gói, phải là duy nhất trong hệ thống.
 *       - **max_places**: Số lượng địa điểm tối đa user được đăng khi dùng gói này.
 *       - **price**: Giá gói (VNĐ). Đặt 0 cho gói miễn phí.
 *       - **duration_days**: Số ngày hiệu lực kể từ ngày user đăng ký.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageCreateRequest'
 *           examples:
 *             free:
 *               summary: Gói Free
 *               value:
 *                 name: Free
 *                 description: Gói miễn phí, tối đa 3 địa điểm
 *                 max_places: 3
 *                 price: 0
 *                 duration_days: 36500
 *             standard:
 *               summary: Gói Standard 30 ngày
 *               value:
 *                 name: Standard
 *                 description: Gói tiêu chuẩn 30 ngày, tối đa 10 địa điểm
 *                 max_places: 10
 *                 price: 99000
 *                 duration_days: 30
 *             premium:
 *               summary: Gói Premium 1 năm
 *               value:
 *                 name: Premium
 *                 description: Gói cao cấp 1 năm, tối đa 50 địa điểm
 *                 max_places: 50
 *                 price: 799000
 *                 duration_days: 365
 *     responses:
 *       201:
 *         description: Tạo gói thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tên gói đã tồn tại
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
 *       403:
 *         description: Không có quyền Admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.post('/', requireAuth, requireRole('admin'), packageManager.createPackage);

/**
 * @openapi
 * /api/v1/package/{id}:
 *   put:
 *     tags:
 *       - Package
 *     summary: Cập nhật thông tin gói dịch vụ (Admin only)
 *     description: |
 *       Cho phép Admin cập nhật bất kỳ thông tin nào của gói dịch vụ.
 *       Chỉ cần truyền các trường muốn thay đổi (partial update).
 *
 *       **Lưu ý:** Thay đổi `max_places` sẽ ảnh hưởng ngay đến các user đang dùng gói này.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của gói dịch vụ cần cập nhật
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageUpdateRequest'
 *           example:
 *             max_places: 15
 *             price: 129000
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tên gói đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy gói
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.put('/:id', requireAuth, requireRole('admin'), packageManager.updatePackage);

/**
 * @openapi
 * /api/v1/package/{id}:
 *   delete:
 *     tags:
 *       - Package
 *     summary: Xóa gói dịch vụ (Admin only)
 *     description: |
 *       Xóa một gói dịch vụ khỏi hệ thống.
 *
 *       **Ràng buộc:** Không thể xóa gói nếu hiện đang có user sử dụng (status = active).
 *       Hãy chắc chắn chuyển user sang gói khác trước khi xóa.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID của gói dịch vụ cần xóa
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *     responses:
 *       200:
 *         description: Xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Xóa gói dịch vụ thành công' }
 *       400:
 *         description: Gói đang có người dùng active, không thể xóa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Không tìm thấy gói
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.delete('/:id', requireAuth, requireRole('admin'), packageManager.deletePackage);

module.exports = route;
