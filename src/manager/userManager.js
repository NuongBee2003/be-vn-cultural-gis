const bcrypt = require('bcryptjs');
const userController = require('../controller/UserController');
const { BCRYPT_ROUNDS, toUserResponse } = require('../utils/authUtils');

class UserManager {
    async getAll(req, res) {
        try {
            const users = await userController.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateMe(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const { username, avatar, email, password } = req.body || {};

            if (
                username === undefined &&
                avatar === undefined &&
                email === undefined &&
                password === undefined
            ) {
                return res.status(400).json({ message: 'No fields provided for update' });
            }

            const existingUser = await userController.getUserById(userId);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (email && email !== existingUser.email) {
                const userByEmail = await userController.getUserByEmail(email);
                if (userByEmail) {
                    return res.status(409).json({ message: 'Email already in use' });
                }
            }

            const updates = {};
            if (username !== undefined) updates.username = username;
            if (avatar !== undefined) updates.avatar = avatar;
            if (email !== undefined) updates.email = email;
            if (password !== undefined) {
                updates.password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            }

            const updatedUser = await userController.updateUser(userId, updates);
            return res.status(200).json(toUserResponse(updatedUser));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('ERROR:', error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new UserManager();
