const express = require('express');
const route = express.Router();
const UserManager = require('../manager/userManager');
const { requireAuth, requireRole } = require("../middleware");

route.get('/', requireAuth,requireRole('user'), UserManager.getAll);
module.exports = route;