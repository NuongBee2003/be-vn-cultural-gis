const express = require('express');
const route = express.Router();
const folkArtManager = require('../manager/folkArtManager');
const { requireAuth } = require('../middleware');

route.get('/', folkArtManager.getAll);
route.get('/:id', folkArtManager.getDetail);

// Write/Edit operations require auth
route.post('/', requireAuth, folkArtManager.create);
route.put('/:id', requireAuth, folkArtManager.update);
route.delete('/:id', requireAuth, folkArtManager.delete);

module.exports = route;
