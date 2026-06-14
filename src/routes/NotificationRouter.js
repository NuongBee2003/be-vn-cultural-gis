const express = require('express');
const route = express.Router();
const notificationManager = require('../manager/notificationManager');
const { requireAuth } = require('../middleware');

route.get('/', requireAuth, notificationManager.getByUser);
route.put('/read-all', requireAuth, notificationManager.markAllRead);
route.put('/:id/read', requireAuth, notificationManager.markRead);

module.exports = route;
