const db = require('../models');

class ReportController {
    /**
     * Tạo báo cáo mới
     */
    async createReport({ location_id, comment_id, review_id, user_id, report_type, description }) {
        const newReport = await db.Report.create({
            location_id: location_id || null,
            comment_id: comment_id || null,
            review_id: review_id || null,
            user_id: user_id || null,
            report_type,
            description,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
        });

        return newReport;
    }

    /**
     * Lấy danh sách báo cáo (Có phân trang và lọc)
     */
    async getAllReports({ page = 1, limit = 20, status, report_type }) {
        const offset = (page - 1) * limit;

        const whereCondition = {};
        if (status) {
            whereCondition.status = status;
        }
        if (report_type) {
            whereCondition.report_type = report_type;
        }

        const result = await db.Report.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatar']
                },
                {
                    model: db.Location,
                    as: 'location',
                    include: [
                        {
                            model: db.Place,
                            as: 'place',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                {
                    model: db.Comment,
                    as: 'comment',
                    attributes: ['id', 'content', 'created_at']
                },
                {
                    model: db.Review,
                    as: 'review',
                    attributes: ['id', 'rating', 'comment', 'created_at']
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            rows: result.rows,
            count: result.count,
            page,
            limit
        };
    }

    /**
     * Lấy chi tiết 1 báo cáo
     */
    async getReportById(id) {
        const report = await db.Report.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'user',
                    attributes: ['id', 'username', 'email', 'avatar']
                },
                {
                    model: db.Location,
                    as: 'location',
                    include: [
                        {
                            model: db.Place,
                            as: 'place'
                        }
                    ]
                },
                {
                    model: db.Comment,
                    as: 'comment'
                },
                {
                    model: db.Review,
                    as: 'review'
                }
            ]
        });

        return report;
    }

    /**
     * Xóa 1 báo cáo
     */
    async deleteReport(id) {
        const report = await db.Report.findByPk(id);
        if (!report) {
            return false;
        }

        await report.destroy();
        return true;
    }

    /**
     * Duyệt báo cáo (Accept): Đổi status -> resolved, đồng thời tự động cập nhật địa điểm thành đóng cửa hoặc xóa bình luận bị báo cáo.
     * Sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu.
     */
    async acceptReport(id) {
        const transaction = await db.sequelize.transaction();
        try {
            const report = await db.Report.findByPk(id, { transaction });
            if (!report) {
                await transaction.rollback();
                return { success: false, code: 'NOT_FOUND', message: 'Không tìm thấy báo cáo' };
            }

            if (report.status === 'resolved') {
                await transaction.rollback();
                return { success: false, code: 'ALREADY_RESOLVED', message: 'Báo cáo này đã được duyệt trước đó' };
            }

            let actionTaken = '';

            // 1. Nếu là báo cáo Địa điểm -> Cập nhật chi nhánh thành đóng cửa (closed)
            if (report.location_id) {
                const location = await db.Location.findByPk(report.location_id, { transaction });
                if (location) {
                    location.status = 'closed';
                    await location.save({ transaction });
                    actionTaken = `Đã cập nhật chi nhánh #${location.id} sang trạng thái đóng cửa (closed)`;
                }
            }

            // 2. Nếu là báo cáo Bình luận -> Xóa bình luận tiêu cực đó
            if (report.comment_id) {
                const comment = await db.Comment.findByPk(report.comment_id, { transaction });
                if (comment) {
                    // Xóa các câu trả lời liên quan trước (nếu có)
                    await db.Comment.destroy({
                        where: { parent_id: comment.id },
                        transaction
                    });
                    await comment.destroy({ transaction });
                    actionTaken = `Đã xóa bình luận #${report.comment_id} bị báo cáo`;
                }
            }

            // 3. Nếu là báo cáo Đánh giá (Review) -> Xóa đánh giá tiêu cực đó
            if (report.review_id) {
                const review = await db.Review.findByPk(report.review_id, { transaction });
                if (review) {
                    await review.destroy({ transaction });
                    actionTaken = `Đã xóa đánh giá #${report.review_id} bị báo cáo`;
                }
            }

            // 3. Cập nhật trạng thái báo cáo thành đã xử lý (resolved)
            report.status = 'resolved';
            report.updated_at = new Date();
            await report.save({ transaction });

            await transaction.commit();

            return {
                success: true,
                data: report,
                actionTaken
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Từ chối báo cáo (Reject): Đổi status -> rejected
     */
    async rejectReport(id) {
        const report = await db.Report.findByPk(id);
        if (!report) {
            return { success: false, code: 'NOT_FOUND', message: 'Không tìm thấy báo cáo' };
        }

        report.status = 'rejected';
        report.updated_at = new Date();
        await report.save();

        return {
            success: true,
            data: report
        };
    }
}

module.exports = new ReportController();
