const db = require('../models');

class UserController {
    async getAllUsers() {
        return db.User.findAll();
    }
}

module.exports = new UserController();
