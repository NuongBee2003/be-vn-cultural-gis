const express = require('express');
const route = express.Router();
const LocationController = require('../controller/LocationController');

route.get('/', LocationController.getAllLocations);
route.post('/', LocationController.create);
route.delete('/:id', LocationController.delete);

module.exports = route;