const express = require('express');
const route = express.Router();

const AuthManager = require('../manager/authManager');

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
route.post('/register', AuthManager.register);

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
route.post('/login', AuthManager.login);
route.post('/forgot-password', AuthManager.forgotPassword);
route.post('/reset-password', AuthManager.resetPassword);

module.exports = route;
