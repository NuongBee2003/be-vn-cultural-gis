const express = require('express');
const route = express.Router();
const folkArtManager = require('../manager/folkArtManager');
const { requireAuth } = require('../middleware');

/**
 * @openapi
 * /api/v1/folk-art:
 *   get:
 *     tags:
 *       - FolkArt
 *     summary: Lấy danh sách nghệ thuật dân gian
 *     description: Trả về danh sách tất cả các loại hình nghệ thuật dân gian truyền thống Việt Nam.
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FolkArtListResponse'
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/', folkArtManager.getAll);

/**
 * @openapi
 * /api/v1/folk-art/{id}:
 *   get:
 *     tags:
 *       - FolkArt
 *     summary: Lấy chi tiết loại hình nghệ thuật dân gian
 *     description: Trả về thông tin chi tiết của một loại hình nghệ thuật dân gian truyền thống bằng ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại hình nghệ thuật
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FolkArtResponse'
 *       '404':
 *         description: Không tìm thấy loại hình nghệ thuật
 *       '500':
 *         description: Lỗi hệ thống
 */
route.get('/:id', folkArtManager.getDetail);

/**
 * @openapi
 * /api/v1/folk-art:
 *   post:
 *     tags:
 *       - FolkArt
 *     summary: Tạo loại hình nghệ thuật dân gian mới
 *     description: Thêm một loại hình nghệ thuật dân gian mới vào hệ thống. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FolkArtCreateRequest'
 *     responses:
 *       '201':
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FolkArtResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '500':
 *         description: Lỗi hệ thống
 */
route.post('/', requireAuth, folkArtManager.create);

/**
 * @openapi
 * /api/v1/folk-art/{id}:
 *   put:
 *     tags:
 *       - FolkArt
 *     summary: Cập nhật loại hình nghệ thuật dân gian
 *     description: Sửa đổi thông tin loại hình nghệ thuật dân gian. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại hình nghệ thuật cần sửa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FolkArtUpdateRequest'
 *     responses:
 *       '200':
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FolkArtResponse'
 *       '400':
 *         description: Dữ liệu không hợp lệ
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy nghệ thuật dân gian này
 *       '500':
 *         description: Lỗi hệ thống
 */
route.put('/:id', requireAuth, folkArtManager.update);

/**
 * @openapi
 * /api/v1/folk-art/{id}:
 *   delete:
 *     tags:
 *       - FolkArt
 *     summary: Xóa loại hình nghệ thuật dân gian
 *     description: Gỡ bỏ loại hình nghệ thuật dân gian khỏi hệ thống. Yêu cầu đăng nhập.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID loại hình nghệ thuật cần xóa
 *     responses:
 *       '200':
 *         description: Xóa thành công
 *       '401':
 *         description: Chưa xác thực người dùng
 *       '404':
 *         description: Không tìm thấy nghệ thuật dân gian này
 *       '500':
 *         description: Lỗi hệ thống
 */
route.delete('/:id', requireAuth, folkArtManager.delete);

module.exports = route;
