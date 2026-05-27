const express = require('express');
const route = express.Router();
const rateLimit = require('express-rate-limit');

const AuthManager = require('../manager/authManager');

const authLimiter = rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication requests, please try again later' },
});

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng ký tài khoản người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRegisterRequest'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad Request
 *       409:
 *         description: Email already in use
 */
route.post('/register', authLimiter, AuthManager.register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Đăng nhập và nhận JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthLoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Invalid email or password
 */
route.post('/login', authLimiter, AuthManager.login);

module.exports = route;
