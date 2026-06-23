const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

class RoleController {
    /**
     * Liệt kê các role hiện có trong hệ thống
     * Vì chúng ta dùng hệ thống phân quyền đơn giản với ENUM, ta chỉ cần trả về mảng cứng.
     */
    async getRoles(req, res) {
        try {
            // Lấy trực tiếp từ values của ENUM nếu cần, hoặc trả về mảng tĩnh
            const roles = [
                { id: 'admin', name: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống' },
                { id: 'user', name: 'Người dùng', description: 'Người dùng bình thường' }
            ];
            
            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy danh sách role thành công',
                data: roles
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách role:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * Cập nhật role cho nhiều user cùng lúc
     * Body: { role: 'admin', userIds: [1, 2, 3] }
     */
    async assignRole(req, res) {
        try {
            const { role, userIds } = req.body;

            // Validate dữ liệu
            if (!role || !['admin', 'user'].includes(role)) {
                return sendError(res, 400, 'Role không hợp lệ');
            }

            if (!Array.isArray(userIds) || userIds.length === 0) {
                return sendError(res, 400, 'Danh sách userIds không hợp lệ');
            }

            // Update database sử dụng toán tử IN
            const [updatedCount] = await db.User.update(
                { role: role },
                { 
                    where: { 
                        id: { [db.Sequelize.Op.in]: userIds } 
                    } 
                }
            );

            return sendSuccess(res, {
                statusCode: 200,
                message: `Đã cập nhật quyền ${role} cho ${updatedCount} người dùng thành công`,
                data: {
                    updatedCount,
                    role
                }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật role cho user:', error);
            return sendError(res, 500, 'Lỗi server khi cập nhật role');
        }
    }
}

module.exports = new RoleController();
