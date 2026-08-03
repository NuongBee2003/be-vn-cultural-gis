const express = require('express');
const reportManager = require('../manager/reportManager');
const { requireAuth, requireRole, optionalAuth } = require('../middleware');

const route = express.Router();

/**
 * @route   POST /api/v1/report
 * @desc    Gửi báo cáo mới (về địa điểm sai vị trí, đóng cửa hoặc bình luận tiêu cực)
 * @access  Public / Optional Auth (nếu có đăng nhập sẽ lưu user_id)
 */
route.post('/', optionalAuth, reportManager.createReport);

/**
 * @route   GET /api/v1/report
 * @desc    Lấy danh sách các báo cáo (cho Admin)
 * @access  Private (Admin)
 */
route.get('/', requireAuth, requireRole('admin'), reportManager.getAllReports);

/**
 * @route   GET /api/v1/report/:id
 * @desc    Xem chi tiết 1 báo cáo
 * @access  Private (Admin)
 */
route.get('/:id', requireAuth, requireRole('admin'), reportManager.getReportById);

/**
 * @route   DELETE /api/v1/report/:id
 * @desc    Xóa 1 báo cáo
 * @access  Private (Admin)
 */
route.delete('/:id', requireAuth, requireRole('admin'), reportManager.deleteReport);

/**
 * @route   PATCH /api/v1/report/:id/accept
 * @desc    Duyệt báo cáo và tự động thực hiện hành động (đóng cửa địa điểm hoặc xóa bình luận)
 * @access  Private (Admin)
 */
route.patch('/:id/accept', requireAuth, requireRole('admin'), reportManager.acceptReport);

/**
 * @route   PATCH /api/v1/report/:id/reject
 * @desc    Từ chối báo cáo
 * @access  Private (Admin)
 */
route.patch('/:id/reject', requireAuth, requireRole('admin'), reportManager.rejectReport);

module.exports = route;
