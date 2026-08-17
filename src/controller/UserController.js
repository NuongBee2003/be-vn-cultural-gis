const db = require('../models');

class UserController {
    async getAllUsers() {
        return db.User.findAll({
            attributes: ['id', 'username', 'avatar']
        });
    }

    async getAllUsersAdmin() {
        return db.User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'status', 'avatar', 'created_at'],
            order: [['created_at', 'DESC']],
        });
    }

    async getUserByEmail(email) {
        return db.User.findOne({ where: { email } });
    }

    async getUserById(id) {
        return db.User.findByPk(id);
    }

    async createUser(payload) {
        return db.User.create(payload);
    }

    async updateUser(id, payload) {
        const user = await db.User.findByPk(id);
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            throw err;
        }
        await user.update(payload);
        return user;
    }
}

module.exports = new UserController();
