const express = require('express');
const route = express.Router();
const CategoryManager = require('../manager/categoryManager');
const { requireAuth, requireRole } = require("../middleware");

route.get('/', requireAuth,requireRole('user'), CategoryManager.getAllCategories);
route.post('/', requireAuth,requireRole('admin'), CategoryManager.create);
route.delete('/:id', requireAuth,requireRole('admin'), CategoryManager.delete);
route.put('/:id', requireAuth,requireRole('admin'), CategoryManager.update);

module.exports = route;