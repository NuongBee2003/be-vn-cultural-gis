const express = require('express');
const ReviewManager = require('../manager/reviewManager');
const placeManager = require('../manager/placeManager');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

/**
 * Lấy danh sách toàn bộ đánh giá (cho admin)
 * Bao gồm thống kê đồ ăn và địa điểm du lịch
 */
route.get('/admin/all', requireAuth, requireRole('admin'), ReviewManager.getAllReviewsAdmin);

/**
 * Admin xóa đánh giá. API này sử dụng hàm deleteReview có sẵn trong placeManager.
 */
route.delete('/:reviewId', requireAuth, requireRole('admin'), placeManager.deleteReview);

/**
 * Thích/Bỏ thích đánh giá
 */
route.post('/:id/like', requireAuth, ReviewManager.toggleLike);

module.exports = route;
