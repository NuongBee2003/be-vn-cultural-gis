const express = require('express');
const SettingController = require('../controller/SettingController');
const { requireAuth, requireRole } = require('../middleware');
const SettingRoute = express.Router();

SettingRoute.get('/', SettingController.getAllSettings);

SettingRoute.put('/', requireAuth, requireRole('admin'), SettingController.updateSettingsBulk);

module.exports = SettingRoute;
