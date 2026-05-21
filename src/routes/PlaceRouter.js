const express = require('express');
const route = express.Router();

const PlaceManager = require('../manager/placeManager');

route.get('/', PlaceManager.getAllPlaces);
route.post('/', PlaceManager.create);
route.put('/:id', PlaceManager.update);
route.delete('/:id', PlaceManager.delete);

module.exports = route;