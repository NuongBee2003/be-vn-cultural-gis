const express = require('express');
const route = express.Router();

const PlaceController = require('../controller/PlaceController');

route.get('/', PlaceController.getAllPlaces);
route.post('/', PlaceController.create);
route.delete('/:id', PlaceController.delete);

module.exports = route;