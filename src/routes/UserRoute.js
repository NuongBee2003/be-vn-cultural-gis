const express = require('express');
const route = express.Router();
const rateLimit = require('express-rate-limit');
const UserManager = require('../manager/userManager');
const { requireAuth, requireRole } = require("../middleware");

const userUpdateLimiter = rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: Number.parseInt(process.env.RATE_LIMIT_UPDATE_MAX || '20', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many update requests, please try again later' },
});

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
route.put('/me', userUpdateLimiter, requireAuth, UserManager.updateMe);
module.exports = route;