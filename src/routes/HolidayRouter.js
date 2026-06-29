const express = require('express');
const router = express.Router();
const HolidayController = require('../controller/HolidayController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', HolidayController.getAllHolidays);
router.post('/', requireAuth, requireRole('admin'), HolidayController.createHoliday);
router.put('/:id', requireAuth, requireRole('admin'), HolidayController.updateHoliday);
router.delete('/:id', requireAuth, requireRole('admin'), HolidayController.deleteHoliday);

module.exports = router;
