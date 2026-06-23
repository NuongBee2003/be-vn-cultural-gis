const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

class PermissionController {
    /**
     * Liệt kê tất cả các permission có trong hệ thống
     * GET /api/v1/permission
     */
    async getAllPermissions(req, res) {
        try {
            const permissions = await db.Permission.findAll({
                order: [['name', 'ASC']]
            });

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy danh sách permission thành công',
                data: permissions
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách permission:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }
}

module.exports = new PermissionController();
