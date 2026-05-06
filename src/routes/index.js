const express = require('express');

const healthRoutes = require('./health.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/users', usersRoutes);

module.exports = router;
