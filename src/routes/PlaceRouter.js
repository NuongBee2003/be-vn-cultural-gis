const express = require('express');
const route = express.Router();

const PlaceManager = require('../manager/placeManager');
const { requireAuth } = require('../middleware');

route.get('/', PlaceManager.getAllPlaces);
/**
 * @openapi
 * /api/v1/place/{id}:
 *   get:
 *     tags:
 *       - Place
 *     summary: Get place detail (assets + reviews + review likes)
 *     description: |
 *       Trả về chi tiết 1 địa điểm (place), gồm:
 *       - Ảnh của place (assets)
 *       - Danh sách locations, mỗi location có `review_count` và `rating_avg`
 *       - Reviews (comment/rating), kèm user, ảnh review (nếu có)
 *       - Like count và danh sách user đã like từng review
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Place ID
 *         example: 14
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Place not found
 */
route.get('/:id', PlaceManager.getDetail);
/**
 * @openapi
 * /api/v1/place/{id}/review:
 *   post:
 *     tags:
 *       - Place
 *     summary: Tạo review cho một địa điểm
 *     description: |
 *       API nhận rating/comment cho 1 place. Hệ thống sẽ tự gắn review vào location đầu tiên
 *       của place đó để lưu xuống bảng reviews.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Place ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaceReviewCreateRequest'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlaceReviewResponse'
 *       '400':
 *         description: Bad Request
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Place not found
 */
route.post('/:id/review', requireAuth, PlaceManager.createReview);
route.delete('/:id/review/:reviewId', requireAuth, PlaceManager.deleteReview);
/**
 * @openapi
 * /api/v1/place:
 *   post:
 *     tags:
 *       - Place
 *     summary: Tạo mới địa điểm (place) kèm danh sách locations (tùy chọn)
 *     description: |
 *       Tạo mới một địa điểm. Nếu truyền thêm mảng `locations`, API sẽ tự động tạo các location này 
 *       và gắn với place vừa tạo thông qua transaction.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlaceCreateRequest'
 *     responses:
 *       201:
 *         description: Created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Đối tượng Place vừa được tạo (bao gồm locations nếu có truyền)
 *       400:
 *         description: Bad Request (Thiếu dữ liệu bắt buộc hoặc sai định dạng)
 *       500:
 *         description: Internal server error
 */
route.post('/', PlaceManager.create);
route.put('/:id', PlaceManager.update);
route.delete('/:id', PlaceManager.delete);

module.exports = route;