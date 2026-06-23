const express = require('express');
const roleController = require('../controller/RoleController');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

// Lấy danh sách toàn bộ role (bao gồm permissions)
route.get('/', requireAuth, requireRole('admin'), roleController.getAllRoles);

// Lấy chi tiết 1 role (bao gồm permissions)
route.get('/:id', requireAuth, requireRole('admin'), roleController.getRoleById);

// Tạo mới 1 role (có thể kèm theo danh sách permissionIds để cấp quyền)
route.post('/', requireAuth, requireRole('admin'), roleController.createRole);

// Cập nhật role và quyền (permissionIds)
route.put('/:id', requireAuth, requireRole('admin'), roleController.updateRole);

// Xóa role
route.delete('/:id', requireAuth, requireRole('admin'), roleController.deleteRole);

module.exports = route;
