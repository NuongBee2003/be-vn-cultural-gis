const express = require('express');
const route = express.Router();

const SearchManager = require('../manager/searchManager');

/**
 * @openapi
 * /api/v1/search/place-locations:
 *   get:
 *     tags:
 *       - Search
 *     summary: Search place locations (Elasticsearch)
 *     description: |
 *       Tìm kiếm marker theo `query` trong index `place_locations`.
 *
 *       - Search query: truyền `query`
 *
 *       Yêu cầu bật Elasticsearch bằng cách set `ELASTICSEARCH_URL`.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Nội dung tìm kiếm theo name/address/description.
 *         example: chua
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       location_id:
 *                         type: integer
 *                         example: 14
 *                       place_id:
 *                         type: integer
 *                         example: 14
 *                       name:
 *                         type: string
 *                         example: Bảo tàng Mỹ thuật TP.HCM
 *                       address:
 *                         type: string
 *                         example: 97A Phó Đức Chính, Q.1
 *                       description:
 *                         type: string
 *                         example: Dinh thự cũ của Chú Hỏa, kiến trúc Baroque rực rỡ.
 *                       lat:
 *                         type: number
 *                         example: 10.769531
 *                       lng:
 *                         type: number
 *                         example: 106.699478
 *                       geo:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 10.769531
 *                           lon:
 *                             type: number
 *                             example: 106.699478
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 34
 *                     index:
 *                       type: string
 *                       example: place_locations
 *       400:
 *         description: Invalid request (missing query)
 *       503:
 *         description: Elasticsearch is not enabled/available
 */
route.get('/place-locations', SearchManager.placeLocations);

/**
 * @openapi
 * /api/v1/search/place-locations-db:
 *   get:
 *     tags:
 *       - Search
 *     summary: Tìm kiếm location bằng DB (không cần Elasticsearch)
 *     description: |
 *       Tìm kiếm địa điểm theo `query` trực tiếp từ database (MySQL/Sequelize).
 *
 *       - Hỗ trợ tiếng Việt **có dấu** lẫn **không dấu** (ví dụ "chua" → "Chùa Thiên Mụ").
 *       - Tìm theo `Place.name` và `Location.address`.
 *       - Phân trang qua `page` và `limit`.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Từ khóa tìm kiếm (tiếng Việt có/không dấu đều được).
 *         example: chua thien mu
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Trang hiện tại
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số kết quả mỗi trang (tối đa 100)
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       place_id:
 *                         type: integer
 *                         example: 3
 *                       name:
 *                         type: string
 *                         example: Chùa Thiên Mụ
 *                       description:
 *                         type: string
 *                       thumbnail:
 *                         type: string
 *                         nullable: true
 *                         example: https://example.com/image.jpg
 *                       category:
 *                         type: object
 *                         nullable: true
 *                       locations:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             location_id:
 *                               type: integer
 *                             lat:
 *                               type: number
 *                             lng:
 *                               type: number
 *                             address:
 *                               type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: Thiếu query
 */
route.get('/place-locations-db', SearchManager.placeLocationsByDB);

module.exports = route;
