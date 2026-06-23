const express = require('express');
const permissionController = require('../controller/PermissionController');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

// Lấy danh sách permission (yêu cầu quyền admin)
route.get('/', requireAuth, requireRole('admin'), permissionController.getAllPermissions);

module.exports = route;
