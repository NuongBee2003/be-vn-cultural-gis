const express = require('express');
const route = express.Router();
const cuisineManager = require('../manager/cuisineManager');
const { requireAuth } = require('../middleware');

route.get('/', cuisineManager.getAll);
route.get('/:id', cuisineManager.getDetail);

// Write/Edit operations require auth
route.post('/', requireAuth, cuisineManager.create);
route.put('/:id', requireAuth, cuisineManager.update);
route.delete('/:id', requireAuth, cuisineManager.delete);

// Recommendation spots
route.post('/:id/recommend', requireAuth, cuisineManager.addRecommendation);
route.delete('/recommend/:recId', requireAuth, cuisineManager.removeRecommendation);

module.exports = route;
