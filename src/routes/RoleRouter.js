const express = require('express');
const roleManager = require('../manager/roleManager');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

// Lấy danh sách toàn bộ role (bao gồm permissions)
route.get('/', requireAuth, requireRole('admin'), roleManager.getAllRoles);

// Lấy chi tiết 1 role (bao gồm permissions)
route.get('/:id', requireAuth, requireRole('admin'), roleManager.getRoleById);

// Tạo mới 1 role (có thể kèm theo danh sách permissionIds để cấp quyền)
route.post('/', requireAuth, requireRole('admin'), roleManager.createRole);

// Cập nhật role và quyền (permissionIds)
route.put('/:id', requireAuth, requireRole('admin'), roleManager.updateRole);

// Xóa role
route.delete('/:id', requireAuth, requireRole('admin'), roleManager.deleteRole);

module.exports = route;
