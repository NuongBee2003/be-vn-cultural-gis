const express = require('express');
const permissionManager = require('../manager/permissionManager');
const { requireAuth, requireRole } = require('../middleware');

const route = express.Router();

// Lấy danh sách permission (yêu cầu quyền admin)
route.get('/', requireAuth, requireRole('admin'), permissionManager.getAllPermissions);

module.exports = route;
