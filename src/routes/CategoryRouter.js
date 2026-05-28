const express = require('express');
const route = express.Router();
const CategoryManager = require('../manager/categoryManager');
const { requireAuth, requireRole } = require("../middleware");

/**
 * @openapi
 * /api/v1/category:
 *   get:
 *     tags:
 *       - Category
 *     summary: Lấy danh sách category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 */
route.get('/', requireAuth,requireRole('user'), CategoryManager.getAllCategories);

/**
 * @openapi
 * /api/v1/category:
 *   post:
 *     tags:
 *       - Category
 *     summary: Tạo category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Created
 */
route.post('/', requireAuth,requireRole('admin'), CategoryManager.create);

/**
 * @openapi
 * /api/v1/category/{id}:
 *   delete:
 *     tags:
 *       - Category
 *     summary: Xóa category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: OK
 */
route.delete('/:id', requireAuth,requireRole('admin'), CategoryManager.delete);

/**
 * @openapi
 * /api/v1/category/{id}:
 *   put:
 *     tags:
 *       - Category
 *     summary: Cập nhật category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: OK
 */
route.put('/:id', requireAuth,requireRole('admin'), CategoryManager.update);

module.exports = route;