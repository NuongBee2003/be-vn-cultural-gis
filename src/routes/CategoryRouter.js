const express = require('express');
const route = express.Router();
const CategoryController = require('../controller/CategoryController');
const { requireAuth, requireRole } = require("../middleware");

route.get('/', requireAuth,requireRole('user'), CategoryController.getAllCategories);
route.post('/', requireAuth,requireRole('admin'), CategoryController.create);
route.delete('/:id', requireAuth,requireRole('admin'), CategoryController.delete);
route.put('/:id', requireAuth,requireRole('admin'), CategoryController.update);