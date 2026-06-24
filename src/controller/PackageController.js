const db = require('../models');

class PackageController {
    /**
     * Lấy danh sách tất cả các gói dịch vụ (Public)
     */
    async getAllPackages() {
        return db.Package.findAll({
            order: [['price', 'ASC']],
        });
    }

    /**
     * Lấy chi tiết một gói dịch vụ (Public)
     */
    async getPackageById(id) {
        const pkg = await db.Package.findByPk(id);
        if (!pkg) {
            const err = new Error('Không tìm thấy gói dịch vụ');
            err.statusCode = 404;
            throw err;
        }
        return pkg;
    }

    /**
     * Tạo gói dịch vụ mới (Admin only)
     */
    async createPackage({ name, description, max_places, price, duration_days }) {
        if (!name || typeof name !== 'string' || !name.trim()) {
            const err = new Error('Tên gói là bắt buộc');
            err.statusCode = 400;
            throw err;
        }
        if (max_places === undefined || Number.isNaN(Number(max_places)) || Number(max_places) < 0) {
            const err = new Error('max_places phải là số không âm');
            err.statusCode = 400;
            throw err;
        }
        if (price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
            const err = new Error('price phải là số không âm');
            err.statusCode = 400;
            throw err;
        }
        if (duration_days === undefined || Number.isNaN(Number(duration_days)) || Number(duration_days) <= 0) {
            const err = new Error('duration_days phải là số dương');
            err.statusCode = 400;
            throw err;
        }

        const existing = await db.Package.findOne({ where: { name: name.trim() } });
        if (existing) {
            const err = new Error('Tên gói đã tồn tại');
            err.statusCode = 400;
            throw err;
        }

        return db.Package.create({
            name: name.trim(),
            description: description || null,
            max_places: Number(max_places),
            price: Number(price),
            duration_days: Number(duration_days),
        });
    }

    /**
     * Cập nhật thông tin gói dịch vụ (Admin only)
     */
    async updatePackage(id, { name, description, max_places, price, duration_days }) {
        const pkg = await db.Package.findByPk(id);
        if (!pkg) {
            const err = new Error('Không tìm thấy gói dịch vụ');
            err.statusCode = 404;
            throw err;
        }

        // Kiểm tra tên trùng lặp (nếu đổi tên)
        if (name && name.trim() !== pkg.name) {
            const existing = await db.Package.findOne({ where: { name: name.trim() } });
            if (existing) {
                const err = new Error('Tên gói đã tồn tại');
                err.statusCode = 400;
                throw err;
            }
            pkg.name = name.trim();
        }

        if (description !== undefined) pkg.description = description;
        if (max_places !== undefined) {
            if (Number.isNaN(Number(max_places)) || Number(max_places) < 0) {
                const err = new Error('max_places phải là số không âm');
                err.statusCode = 400;
                throw err;
            }
            pkg.max_places = Number(max_places);
        }
        if (price !== undefined) {
            if (Number.isNaN(Number(price)) || Number(price) < 0) {
                const err = new Error('price phải là số không âm');
                err.statusCode = 400;
                throw err;
            }
            pkg.price = Number(price);
        }
        if (duration_days !== undefined) {
            if (Number.isNaN(Number(duration_days)) || Number(duration_days) <= 0) {
                const err = new Error('duration_days phải là số dương');
                err.statusCode = 400;
                throw err;
            }
            pkg.duration_days = Number(duration_days);
        }

        pkg.updated_at = db.sequelize.literal('CURRENT_TIMESTAMP(3)');
        await pkg.save();
        return pkg;
    }

    /**
     * Xóa gói dịch vụ (Admin only)
     */
    async deletePackage(id) {
        const pkg = await db.Package.findByPk(id);
        if (!pkg) {
            const err = new Error('Không tìm thấy gói dịch vụ');
            err.statusCode = 404;
            throw err;
        }

        // Kiểm tra xem có subscriptions đang active không
        const activeCount = await db.UserSubscription.count({
            where: { package_id: id, status: 'active' },
        });
        if (activeCount > 0) {
            const err = new Error(`Không thể xóa gói đang được ${activeCount} người dùng sử dụng`);
            err.statusCode = 400;
            throw err;
        }

        await pkg.destroy();
        return { success: true };
    }
}

module.exports = new PackageController();
