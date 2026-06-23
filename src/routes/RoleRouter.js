const express = require('express');
const roleController = require('../controller/RoleController');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

// Lấy danh sách các role hiện có trong hệ thống (chỉ cần đăng nhập)
route.get('/', requireAuth, roleController.getRoles);

// Phân quyền cho nhiều người dùng (yêu cầu quyền admin)
route.put('/assign', requireAuth, requireRole('admin'), roleController.assignRole);

module.exports = route;
