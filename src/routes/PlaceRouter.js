const express = require('express');
const route = express.Router();

const PlaceManager = require('../manager/placeManager');

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
 *       - Danh sách locations
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
route.post('/', PlaceManager.create);
route.put('/:id', PlaceManager.update);
route.delete('/:id', PlaceManager.delete);

module.exports = route;