const express = require('express');
const route = express.Router();
const UserController = require('../controller/UserController');
const { requireAuth, requireRole } = require("../middleware");

route.get('/', requireAuth,requireRole('user'), UserController.getAll);
module.exports = route;