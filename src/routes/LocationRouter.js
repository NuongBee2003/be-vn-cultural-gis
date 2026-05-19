const express = require('express');
const route = express.Router();
const LocationController = require('../controller/LocationController');

route.get('/', LocationController.getAllLocations);
route.get('/geo', LocationController.getLocationsByGeo);
route.post('/', LocationController.create);
route.delete('/:id', LocationController.delete);

module.exports = route;
