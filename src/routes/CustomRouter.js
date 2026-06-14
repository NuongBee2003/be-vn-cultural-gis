const express = require('express');
const route = express.Router();
const customManager = require('../manager/customManager');
const { requireAuth } = require('../middleware');

route.get('/', customManager.getAll);
route.get('/:id', customManager.getDetail);

// Write/Edit operations require auth
route.post('/', requireAuth, customManager.create);
route.put('/:id', requireAuth, customManager.update);
route.delete('/:id', requireAuth, customManager.delete);

module.exports = route;
