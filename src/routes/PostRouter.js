const express = require('express');
const route = express.Router();

const PostManager = require('../manager/postManager');
const { requireAuth, optionalAuth } = require('../middleware');


/**
 * @openapi
 * /api/v1/post:
 *   get:
 *     tags:
 *       - Post
 *     summary: Lấy danh sách bài post
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: OK
 */
route.get('/', optionalAuth, PostManager.getAll);

/**
 * @openapi
 * /api/v1/post/{id}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Lấy chi tiết bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Post not found
 */
route.get('/:id', optionalAuth, PostManager.getDetail);

/**
 * @openapi
 * /api/v1/post:
 *   post:
 *     tags:
 *       - Post
 *     summary: Tạo bài post mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreateRequest'
 *     responses:
 *       '201':
 *         description: Created
 *       '400':
 *         description: Bad Request
 *       '401':
 *         description: Unauthorized
 */
route.post('/', requireAuth, PostManager.create);

/**
 * @openapi
 * /api/v1/post/{id}:
 *   put:
 *     tags:
 *       - Post
 *     summary: Chỉnh sửa bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostUpdateRequest'
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Post not found
 */
route.put('/:id', requireAuth, PostManager.update);

/**
 * @openapi
 * /api/v1/post/{id}:
 *   delete:
 *     tags:
 *       - Post
 *     summary: Xóa bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden
 *       '404':
 *         description: Post not found
 */
route.delete('/:id', requireAuth, PostManager.delete);

/**
 * @openapi
 * /api/v1/post/{id}/like:
 *   post:
 *     tags:
 *       - Post
 *     summary: Toggle like / unlike bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       '200':
 *         description: OK (trả về likedYN Y/N và likeCount mới)
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Post not found
 */
route.post('/:id/like', requireAuth, PostManager.toggleLike);

module.exports = route;
