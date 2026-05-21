const express = require('express');
const route = express.Router();
const LocationManager = require('../manager/locationManager');

/**
 * @openapi
 * # Schema definitions are in src/docs/schemas.js
 * paths:
 *   /api/v1/location/geo:
 *     post:
 *       tags:
 *         - Location
 *       summary: Lấy danh sách marker trong khung nhìn bản đồ
 *       description: >
 *         Trả về các điểm (locations) nằm trong bbox. API join sang Place và Category để lấy thông tin hiển thị marker (ví dụ: place.name, category.icon_marker).
 *
 *         Lưu ý: Server hiện merge tham số từ querystring và JSON body; Swagger mô tả theo JSON body để dễ dùng.
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeoViewportRequest'
 *             examples:
 *               default:
 *                 summary: Ví dụ bbox + limit
 *                 value:
 *                   bbox: 106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812
 *                   limit: 20
 *               filterByPlace:
 *                 summary: Lọc theo place_id
 *                 value:
 *                   bbox: 106.68575113624685,10.76988371401646,106.70763796180837,10.78931857765812
 *                   limit: 20
 *                   place_id: 12
 *       responses:
 *         '200':
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/GeoViewportSuccessResponse'
 *         '400':
 *           description: Dữ liệu đầu vào không hợp lệ
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Lỗi hệ thống
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *
 *   /api/v1/location/category/{categoryId}:
 *     get:
 *       tags:
 *         - Location
 *       summary: Lọc danh sách địa điểm theo category
 *       description: Trả về danh sách locations có place thuộc categoryId (kèm place + category để FE lấy icon_marker).
 *       parameters:
 *         - in: path
 *           name: categoryId
 *           required: true
 *           schema:
 *             type: integer
 *             minimum: 1
 *           description: ID của category cần lọc.
 *           example: 1
 *       responses:
 *         '200':
 *           description: OK
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required: [success, message, data]
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   message:
 *                     type: string
 *                     example: OK
 *                   data:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/LocationMarker'
 *                   meta:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: integer
 *                         example: 10
 *                       category_id:
 *                         type: integer
 *                         example: 1
 *         '400':
 *           description: Dữ liệu đầu vào không hợp lệ
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 *         '500':
 *           description: Lỗi hệ thống
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */

route.post('/geo', LocationManager.getLocationsByGeo);
route.get('/category/:categoryId', LocationManager.getLocationsByCategory);
route.get('/:id', LocationManager.getLocationById);
route.post('/', LocationManager.create);
route.delete('/:id', LocationManager.delete);

module.exports = route;
