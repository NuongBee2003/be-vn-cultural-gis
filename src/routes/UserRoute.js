const express = require('express');
const route = express.Router();
const UserManager = require('../manager/userManager');
const { requireAuth, requireRole } = require("../middleware");

/**
 * @openapi
 * /api/v1/user:
 *   get:
 *     tags:
 *       - User
 *     summary: Lấy danh sách người dùng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 */
route.get('/', requireAuth, requireRole('user'), UserManager.getAll);
/**
 * @openapi
 * /api/v1/user/me:
 *   put:
 *     tags:
 *       - User
 *     summary: Cập nhật thông tin người dùng hiện tại
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
route.put('/me', requireAuth, UserManager.updateMe);
module.exports = route;