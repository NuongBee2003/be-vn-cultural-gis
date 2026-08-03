const reportController = require('../controller/ReportController');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const db = require('../models');

class ReportManager {
    /**
     * POST /api/v1/report
     * Tạo mới một báo cáo
     */
    async createReport(req, res) {
        try {
            const { location_id, comment_id, review_id, report_type, description } = req.body;
            const userId = req.userId || null;

            if (!location_id && !comment_id && !review_id) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'Phải cung cấp location_id, comment_id hoặc review_id để báo cáo',
                    code: 'BAD_REQUEST'
                });
            }

            if (!report_type) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'report_type không được để trống',
                    code: 'BAD_REQUEST'
                });
            }

            // Kiểm tra xem location, comment hoặc review có tồn tại không
            if (location_id) {
                const location = await db.Location.findByPk(location_id);
                if (!location) {
                    return sendError(res, {
                        statusCode: 404,
                        message: 'Không tìm thấy chi nhánh/địa điểm này',
                        code: 'NOT_FOUND'
                    });
                }
            }

            if (comment_id) {
                const comment = await db.Comment.findByPk(comment_id);
                if (!comment) {
                    return sendError(res, {
                        statusCode: 404,
                        message: 'Không tìm thấy bình luận này',
                        code: 'NOT_FOUND'
                    });
                }
            }

            if (review_id) {
                const review = await db.Review.findByPk(review_id);
                if (!review) {
                    return sendError(res, {
                        statusCode: 404,
                        message: 'Không tìm thấy đánh giá này',
                        code: 'NOT_FOUND'
                    });
                }
            }

            const report = await reportController.createReport({
                location_id,
                comment_id,
                review_id,
                user_id: userId,
                report_type,
                description
            });

            return sendSuccess(res, {
                statusCode: 201,
                message: 'Tạo báo cáo thành công',
                data: report
            });
        } catch (error) {
            console.error('ERROR createReport:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi tạo báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * GET /api/v1/report
     * Lấy danh sách báo cáo (Cho Admin/Manager)
     */
    async getAllReports(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const status = req.query.status || undefined;
            const report_type = req.query.report_type || undefined;

            const result = await reportController.getAllReports({ page, limit, status, report_type });
            const totalPages = Math.ceil(result.count / result.limit);

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy danh sách báo cáo thành công',
                data: result.rows,
                meta: {
                    total: result.count,
                    count: result.rows.length,
                    page: result.page,
                    limit: result.limit,
                    totalPages
                }
            });
        } catch (error) {
            console.error('ERROR getAllReports:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi lấy danh sách báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * GET /api/v1/report/:id
     * Xem chi tiết một báo cáo
     */
    async getReportById(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'ID báo cáo không hợp lệ',
                    code: 'BAD_REQUEST'
                });
            }

            const report = await reportController.getReportById(id);
            if (!report) {
                return sendError(res, {
                    statusCode: 404,
                    message: 'Không tìm thấy báo cáo',
                    code: 'NOT_FOUND'
                });
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy chi tiết báo cáo thành công',
                data: report
            });
        } catch (error) {
            console.error('ERROR getReportById:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi lấy chi tiết báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * DELETE /api/v1/report/:id
     * Xóa một báo cáo
     */
    async deleteReport(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'ID báo cáo không hợp lệ',
                    code: 'BAD_REQUEST'
                });
            }

            const isDeleted = await reportController.deleteReport(id);
            if (!isDeleted) {
                return sendError(res, {
                    statusCode: 404,
                    message: 'Không tìm thấy báo cáo để xóa',
                    code: 'NOT_FOUND'
                });
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Xóa báo cáo thành công'
            });
        } catch (error) {
            console.error('ERROR deleteReport:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi xóa báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * PATCH /api/v1/report/:id/accept
     * Duyệt báo cáo: Cập nhật status báo cáo = resolved và thực hiện hành động xóa comment hoặc đóng cửa địa điểm
     */
    async acceptReport(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'ID báo cáo không hợp lệ',
                    code: 'BAD_REQUEST'
                });
            }

            const result = await reportController.acceptReport(id);
            if (!result.success) {
                const statusCode = result.code === 'NOT_FOUND' ? 404 : 400;
                return sendError(res, {
                    statusCode,
                    message: result.message,
                    code: result.code
                });
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Duyệt báo cáo và xử lý thành công',
                data: {
                    report: result.data,
                    actionTaken: result.actionTaken
                }
            });
        } catch (error) {
            console.error('ERROR acceptReport:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi duyệt báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }

    /**
     * PATCH /api/v1/report/:id/reject
     * Từ chối báo cáo: Cập nhật status báo cáo = rejected
     */
    async rejectReport(req, res) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return sendError(res, {
                    statusCode: 400,
                    message: 'ID báo cáo không hợp lệ',
                    code: 'BAD_REQUEST'
                });
            }

            const result = await reportController.rejectReport(id);
            if (!result.success) {
                return sendError(res, {
                    statusCode: 404,
                    message: result.message,
                    code: result.code
                });
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Từ chối báo cáo thành công',
                data: result.data
            });
        } catch (error) {
            console.error('ERROR rejectReport:', error);
            return sendError(res, {
                statusCode: 500,
                message: 'Lỗi hệ thống khi từ chối báo cáo',
                code: 'INTERNAL_ERROR'
            });
        }
    }
}

module.exports = new ReportManager();
