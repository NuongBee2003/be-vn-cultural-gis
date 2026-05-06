const express = require('express');
const route = express.Router();
const UserController = require('../controller/UserController');
route.get('/',UserController.getAll);
module.exports = route;