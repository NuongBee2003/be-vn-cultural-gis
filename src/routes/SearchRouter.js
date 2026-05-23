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

module.exports = route;
