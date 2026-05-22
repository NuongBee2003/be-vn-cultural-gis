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
 *       Tìm kiếm marker theo **text** hoặc theo **toạ độ** (geo_distance) trong index `place_locations`.
 *
 *       - Text search: truyền `q`
 *       - Geo search: truyền `lat,lng` (hoặc `q` dạng `lat,lng`) + `radius`
 *
 *       Yêu cầu bật Elasticsearch bằng cách set `ELASTICSEARCH_URL`.
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: false
 *         description: Text query, hoặc chuỗi dạng `lat,lng` (ví dụ `10.769531,106.699478`).
 *         example: chua
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: false
 *         description: Latitude (nếu muốn geo search).
 *         example: 10.769531
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: false
 *         description: Longitude (nếu muốn geo search).
 *         example: 106.699478
 *       - in: query
 *         name: radius
 *         schema:
 *           type: string
 *           default: 200m
 *         required: false
 *         description: Bán kính geo_distance (ví dụ `200m`, `3km`).
 *         example: 3km
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *         required: false
 *         description: Số lượng kết quả trả về.
 *         example: 5
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
 *                     mode:
 *                       type: string
 *                       example: geo
 *                     total:
 *                       type: integer
 *                       example: 34
 *                     size:
 *                       type: integer
 *                       example: 5
 *                     radius:
 *                       type: string
 *                       example: 3km
 *                     index:
 *                       type: string
 *                       example: place_locations
 *       400:
 *         description: Invalid request (missing q or invalid lat/lng)
 *       503:
 *         description: Elasticsearch is not enabled/available
 */
route.get('/place-locations', SearchManager.placeLocations);

module.exports = route;
