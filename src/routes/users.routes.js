const express = require('express');

const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users.controller');

const router = express.Router();

router.get('/', listUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
