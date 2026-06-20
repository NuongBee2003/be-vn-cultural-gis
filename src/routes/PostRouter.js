const express = require('express');
const route = express.Router();

const PostManager = require('../manager/postManager');
const { requireAuth, requireRole, optionalAuth } = require('../middleware');


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
 * /api/v1/post/admin:
 *   get:
 *     tags:
 *       - Post
 *     summary: Admin lấy danh sách tất cả bài post (có phân quyền)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc bài viết theo trạng thái (pending, accepted, rejected)
 *     responses:
 *       '200':
 *         description: OK
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden (Không phải admin)
 */
route.get('/admin', requireAuth, requireRole('admin'), PostManager.getAllAdmin);

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

/**
 * @openapi
 * /api/v1/post/{id}/likes:
 *   get:
 *     tags:
 *       - Post
 *     summary: Lấy danh sách những người đã thích bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của bài post
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: Post not found
 */
route.get('/:id/likes', optionalAuth, PostManager.getLikes);

/**
 * @openapi
 * /api/v1/post/{id}/comments:
 *   get:
 *     tags:
 *       - Post
 *     summary: Lấy danh sách comment của bài post (nested, có phân trang)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của bài post
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Số comment gốc mỗi trang
 *     responses:
 *       '200':
 *         description: OK — Danh sách comment gốc (nested replies), có phân trang
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostCommentsPagedResponse'
 *       '404':
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
route.get('/:id/comments', optionalAuth, PostManager.getComments);

/**
 * @openapi
 * /api/v1/post/{id}/review:
 *   post:
 *     tags:
 *       - Post
 *     summary: Admin phê duyệt hoặc từ chối bài post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của bài post cần duyệt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: Trạng thái duyệt ('accepted' hoặc 'rejected')
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Bad Request
 *       '401':
 *         description: Unauthorized
 *       '403':
 *         description: Forbidden (Không phải Admin)
 *       '404':
 *         description: Post not found
 */
route.post('/:id/review', requireAuth, requireRole('admin'), PostManager.review);

/**
 * @openapi
 * /api/v1/post/{id}/share:
 *   post:
 *     tags:
 *       - Post
 *     summary: Chia sẻ bài viết (trả về URL tới bài viết đó)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID của bài post cần chia sẻ
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareUrl:
 *                       type: string
 *       '403':
 *         description: Forbidden (Bạn không có quyền truy cập bài viết này)
 *       '404':
 *         description: Post not found
 */
route.post('/:id/share', optionalAuth, PostManager.share);

module.exports = route;

