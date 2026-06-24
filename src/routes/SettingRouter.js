const express = require('express');
const settingManager = require('../manager/settingManager');
const { requireAuth, requireRole } = require('../middleware');
const SettingRoute = express.Router();

SettingRoute.get('/', settingManager.getAllSettings);

SettingRoute.put('/', requireAuth, requireRole('admin'), settingManager.updateSettingsBulk);

module.exports = SettingRoute;
