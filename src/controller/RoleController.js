const db = require('../models');

class RoleController {
    /**
     * Lấy danh sách tất cả các role kèm theo danh sách permission
     */
    async getAllRoles() {
        const roles = await db.Role.findAll({
            include: [{
                model: db.Permission,
                as: 'permission_id_permissions', // Theo association trong init-models.js
                attributes: ['id', 'name', 'description'],
                through: { attributes: [] } // Bỏ qua bảng trung gian
            }],
            order: [['created_at', 'DESC']]
        });

        return roles.map(role => {
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
    }

    /**
     * Lấy chi tiết một role
     */
    async getRoleById(id) {
        const role = await db.Role.findByPk(id, {
            include: [{
                model: db.Permission,
                as: 'permission_id_permissions',
                attributes: ['id', 'name', 'description'],
                through: { attributes: [] }
            }]
        });

        if (!role) {
            const err = new Error('Không tìm thấy role');
            err.statusCode = 404;
            throw err;
        }

        const plainRole = role.get({ plain: true });
        return {
            id: plainRole.id,
            name: plainRole.name,
            description: plainRole.description,
            permissions: plainRole.permission_id_permissions,
            created_at: plainRole.created_at,
            updated_at: plainRole.updated_at
        };
    }

    /**
     * Tạo mới một role và gán permission
     */
    async createRole({ name, description, permissionIds }) {
        if (!name) {
            const err = new Error('Tên role là bắt buộc');
            err.statusCode = 400;
            throw err;
        }

        const existingRole = await db.Role.findOne({ where: { name } });
        if (existingRole) {
            const err = new Error('Tên role đã tồn tại');
            err.statusCode = 400;
            throw err;
        }

        const transaction = await db.sequelize.transaction();
        try {
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
            return newRole;
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Cập nhật thông tin role và cấp/thu hồi permission
     */
    async updateRole(id, { name, description, permissionIds }) {
        const role = await db.Role.findByPk(id);
        if (!role) {
            const err = new Error('Không tìm thấy role');
            err.statusCode = 404;
            throw err;
        }

        if (name && name !== role.name) {
            const existingRole = await db.Role.findOne({ where: { name } });
            if (existingRole) {
                const err = new Error('Tên role đã tồn tại');
                err.statusCode = 400;
                throw err;
            }
            role.name = name;
        }

        if (description !== undefined) {
            role.description = description;
        }

        const transaction = await db.sequelize.transaction();
        try {
            await role.save({ transaction });

            // Cập nhật permissions
            if (Array.isArray(permissionIds)) {
                await role.setPermission_id_permissions(permissionIds, { transaction });
            }

            await transaction.commit();
            return role;
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }

    /**
     * Xóa role
     */
    async deleteRole(id) {
        const role = await db.Role.findByPk(id);
        if (!role) {
            const err = new Error('Không tìm thấy role');
            err.statusCode = 404;
            throw err;
        }

        const transaction = await db.sequelize.transaction();
        try {
            // Xóa liên kết permissions trước
            await role.setPermission_id_permissions([], { transaction });

            // Xóa role
            await role.destroy({ transaction });

            await transaction.commit();
            return { success: true };
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }
    }
}

module.exports = new RoleController();
