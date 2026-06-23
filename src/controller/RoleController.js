const db = require('../models');
const { sendSuccess, sendError } = require('../utils/apiResponse');

class RoleController {
    /**
     * Lấy danh sách tất cả các role kèm theo danh sách permission
     * GET /api/v1/role
     */
    async getAllRoles(req, res) {
        try {
            const roles = await db.Role.findAll({
                include: [{
                    model: db.Permission,
                    as: 'permission_id_permissions', // Theo association trong init-models.js
                    attributes: ['id', 'name', 'description'],
                    through: { attributes: [] } // Bỏ qua bảng trung gian
                }],
                order: [['created_at', 'DESC']]
            });

            // Map lại tên field cho đẹp nếu cần, hoặc trả về trực tiếp
            const formattedRoles = roles.map(role => {
                const plainRole = role.get({ plain: true });
                return {
                    id: plainRole.id,
                    name: plainRole.name,
                    description: plainRole.description,
                    permissions: plainRole.permission_id_permissions,
                    created_at: plainRole.created_at,
                    updated_at: plainRole.updated_at
                };
            });

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy danh sách role thành công',
                data: formattedRoles
            });
        } catch (error) {
            console.error('Lỗi khi lấy danh sách role:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * Lấy chi tiết một role
     * GET /api/v1/role/:id
     */
    async getRoleById(req, res) {
        try {
            const { id } = req.params;
            const role = await db.Role.findByPk(id, {
                include: [{
                    model: db.Permission,
                    as: 'permission_id_permissions',
                    attributes: ['id', 'name', 'description'],
                    through: { attributes: [] }
                }]
            });

            if (!role) {
                return sendError(res, 404, 'Không tìm thấy role');
            }

            const plainRole = role.get({ plain: true });
            const data = {
                id: plainRole.id,
                name: plainRole.name,
                description: plainRole.description,
                permissions: plainRole.permission_id_permissions,
                created_at: plainRole.created_at,
                updated_at: plainRole.updated_at
            };

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Lấy chi tiết role thành công',
                data
            });
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết role:', error);
            return sendError(res, 500, 'Lỗi server');
        }
    }

    /**
     * Tạo mới một role và gán permission
     * POST /api/v1/role
     * Body: { name: 'Editor', description: 'Biên tập viên', permissionIds: [1, 2, 3] }
     */
    async createRole(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { name, description, permissionIds } = req.body;

            if (!name) {
                return sendError(res, 400, 'Tên role là bắt buộc');
            }

            const existingRole = await db.Role.findOne({ where: { name } });
            if (existingRole) {
                return sendError(res, 400, 'Tên role đã tồn tại');
            }

            // Tạo role mới
            const newRole = await db.Role.create({
                name,
                description
            }, { transaction });

            // Gán permission nếu có
            if (Array.isArray(permissionIds) && permissionIds.length > 0) {
                await newRole.setPermission_id_permissions(permissionIds, { transaction });
            }

            await transaction.commit();

            return sendSuccess(res, {
                statusCode: 201,
                message: 'Tạo role thành công',
                data: newRole
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lỗi khi tạo role:', error);
            return sendError(res, 500, 'Lỗi server khi tạo role');
        }
    }

    /**
     * Cập nhật thông tin role và cấp/thu hồi permission
     * PUT /api/v1/role/:id
     * Body: { name: 'Editor', description: 'Update', permissionIds: [1, 2] }
     */
    async updateRole(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { id } = req.params;
            const { name, description, permissionIds } = req.body;

            const role = await db.Role.findByPk(id);
            if (!role) {
                return sendError(res, 404, 'Không tìm thấy role');
            }

            if (name && name !== role.name) {
                const existingRole = await db.Role.findOne({ where: { name } });
                if (existingRole) {
                    return sendError(res, 400, 'Tên role đã tồn tại');
                }
                role.name = name;
            }

            if (description !== undefined) {
                role.description = description;
            }

            await role.save({ transaction });

            // Cập nhật permissions (hàm set sẽ thay thế hoàn toàn danh sách cũ bằng danh sách mới)
            if (Array.isArray(permissionIds)) {
                await role.setPermission_id_permissions(permissionIds, { transaction });
            }

            await transaction.commit();

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Cập nhật role thành công',
                data: role
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lỗi khi cập nhật role:', error);
            return sendError(res, 500, 'Lỗi server khi cập nhật role');
        }
    }

    /**
     * Xóa role
     * DELETE /api/v1/role/:id
     */
    async deleteRole(req, res) {
        const transaction = await db.sequelize.transaction();
        try {
            const { id } = req.params;

            const role = await db.Role.findByPk(id);
            if (!role) {
                return sendError(res, 404, 'Không tìm thấy role');
            }

            // Xóa liên kết permissions trước
            await role.setPermission_id_permissions([], { transaction });

            // Tùy chọn: Xử lý update users đang có role này về default (nếu sử dụng Foreign Key)
            // Hiện tại bảng User chỉ dùng ENUM, không dùng bảng Role, nên có thể bỏ qua.

            // Xóa role
            await role.destroy({ transaction });

            await transaction.commit();

            return sendSuccess(res, {
                statusCode: 200,
                message: 'Xóa role thành công'
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Lỗi khi xóa role:', error);
            return sendError(res, 500, 'Lỗi server khi xóa role');
        }
    }
}

module.exports = new RoleController();
