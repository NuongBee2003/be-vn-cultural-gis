const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

class PackageController {
    /**
     * GET /api/v1/package
     * Lấy danh sách tất cả các gói dịch vụ (Public)
     */
    async getAllPackages(req, res) {
        try {
            const packages = await db.Package.findAll({
                order: [['price', 'ASC']],
            });

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy danh sách gói dịch vụ thành công',
                data: packages,
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * GET /api/v1/package/:id
     * Lấy chi tiết một gói dịch vụ (Public)
     */
    async getPackageById(req, res) {
        try {
            const { id } = req.params;
            const pkg = await db.Package.findByPk(id);

            if (!pkg) {
                return sendError(res, 404, 'Không tìm thấy gói dịch vụ');
            }

            return sendSuccess(res, {
                statusCode: 200,
                message: 'OK',
                data: pkg,
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * POST /api/v1/package
     * Tạo gói dịch vụ mới (Admin only)
     * Body: { name, description, max_places, price, duration_days }
     */
    async createPackage(req, res) {
        try {
            const { name, description, max_places, price, duration_days } = req.body;

            if (!name || typeof name !== 'string' || !name.trim()) {
                return sendError(res, 400, 'Tên gói là bắt buộc');
            }
            if (max_places === undefined || Number.isNaN(Number(max_places)) || Number(max_places) < 0) {
                return sendError(res, 400, 'max_places phải là số không âm');
            }
            if (price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
                return sendError(res, 400, 'price phải là số không âm');
            }
            if (duration_days === undefined || Number.isNaN(Number(duration_days)) || Number(duration_days) <= 0) {
                return sendError(res, 400, 'duration_days phải là số dương');
            }

            const existing = await db.Package.findOne({ where: { name: name.trim() } });
            if (existing) {
                return sendError(res, 400, 'Tên gói đã tồn tại');
            }

            const pkg = await db.Package.create({
                name: name.trim(),
                description: description || null,
                max_places: Number(max_places),
                price: Number(price),
                duration_days: Number(duration_days),
            });

            return sendSuccess(res, {
                statusCode: 201,
                message: 'Tạo gói dịch vụ thành công',
                data: pkg,
            });
        } catch (error) {
            console.error('Lỗi khi tạo gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * PUT /api/v1/package/:id
     * Cập nhật thông tin gói dịch vụ (Admin only)
     */
    async updatePackage(req, res) {
        try {
            const { id } = req.params;
            const { name, description, max_places, price, duration_days } = req.body;

            const pkg = await db.Package.findByPk(id);
            if (!pkg) {
                return sendError(res, 404, 'Không tìm thấy gói dịch vụ');
            }

            // Kiểm tra tên trùng lặp (nếu đổi tên)
            if (name && name.trim() !== pkg.name) {
                const existing = await db.Package.findOne({ where: { name: name.trim() } });
                if (existing) {
                    return sendError(res, 400, 'Tên gói đã tồn tại');
                }
                pkg.name = name.trim();
            }

            if (description !== undefined) pkg.description = description;
            if (max_places !== undefined) {
                if (Number.isNaN(Number(max_places)) || Number(max_places) < 0) {
                    return sendError(res, 400, 'max_places phải là số không âm');
                }
                pkg.max_places = Number(max_places);
            }
            if (price !== undefined) {
                if (Number.isNaN(Number(price)) || Number(price) < 0) {
                    return sendError(res, 400, 'price phải là số không âm');
                }
                pkg.price = Number(price);
            }
            if (duration_days !== undefined) {
                if (Number.isNaN(Number(duration_days)) || Number(duration_days) <= 0) {
                    return sendError(res, 400, 'duration_days phải là số dương');
                }
                pkg.duration_days = Number(duration_days);
            }

            pkg.updated_at = db.sequelize.literal('CURRENT_TIMESTAMP(3)');
            await pkg.save();

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Cập nhật gói dịch vụ thành công',
                data: pkg,
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * DELETE /api/v1/package/:id
     * Xóa gói dịch vụ (Admin only)
     */
    async deletePackage(req, res) {
        try {
            const { id } = req.params;

            const pkg = await db.Package.findByPk(id);
            if (!pkg) {
                return sendError(res, 404, 'Không tìm thấy gói dịch vụ');
            }

            // Kiểm tra xem có subscriptions đang active không
            const activeCount = await db.UserSubscription.count({
                where: { package_id: id, status: 'active' },
            });
            if (activeCount > 0) {
                return sendError(res, 400, `Không thể xóa gói đang được ${activeCount} người dùng sử dụng`);
            }

            await pkg.destroy();

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Xóa gói dịch vụ thành công',
            });
        } catch (error) {
            console.error('Lỗi khi xóa gói:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }
}

module.exports = new PackageController();
