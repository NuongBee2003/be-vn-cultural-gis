const bcrypt = require('bcryptjs');
const userController = require('../controller/UserController');
const { BCRYPT_ROUNDS, toUserResponse, isValidEmail } = require('../utils/authUtils');

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

    async getAllAdmin(req, res) {
        try {
            const users = await userController.getAllUsersAdmin();
            return res.status(200).json({ success: true, data: users });
        } catch (error) {
            console.error('ERROR:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateRole(req, res) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            
            if (!role || !['admin', 'user', 'business'].includes(role)) {
                return res.status(400).json({ message: 'Role is invalid or missing. Must be admin, user, or business.' });
            }

            const targetUser = await userController.getUserById(id);
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Optional: prevent changing your own role or superadmin role if necessary
            if (targetUser.id === req.userId) {
                return res.status(403).json({ message: 'You cannot change your own role' });
            }

            const updatedUser = await userController.updateUser(id, { role });
            return res.status(200).json({ success: true, data: updatedUser });
        } catch (error) {
            console.error('ERROR in updateRole:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status || !['active', 'banned'].includes(status)) {
                return res.status(400).json({ message: 'Status is invalid or missing. Must be active or banned.' });
            }

            const targetUser = await userController.getUserById(id);
            if (!targetUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent banning yourself
            if (targetUser.id === req.userId) {
                return res.status(403).json({ message: 'You cannot change your own status' });
            }

            // Optional: prevent banning a super admin if necessary
            if (targetUser.role === 'admin' && req.user?.role !== 'superadmin') { // assuming you might have superadmin, otherwise just prevent banning admins if needed
                // It's up to business logic. For now, allow admin to ban others.
            }

            const updatedUser = await userController.updateUser(id, { status });
            return res.status(200).json({ success: true, data: updatedUser });
        } catch (error) {
            console.error('ERROR in updateStatus:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async updateMe(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const { username, avatar, email, password, currentPassword } = req.body || {};

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

            if (email !== undefined) {
                if (!isValidEmail(email)) {
                    return res.status(400).json({ message: 'Invalid email format' });
                }
                const userByEmail = await userController.getUserByEmail(email);
                if (userByEmail && userByEmail.id !== existingUser.id) {
                    return res.status(409).json({ message: 'Email already in use' });
                }
            }

            const updates = {};
            if (username !== undefined) updates.username = username;
            if (avatar !== undefined) updates.avatar = avatar;
            if (email !== undefined) updates.email = email;
            if (password !== undefined) {
                if (!currentPassword) {
                    return res
                        .status(400)
                        .json({ message: 'currentPassword is required to change password' });
                }
                const passwordMatches = await bcrypt.compare(
                    currentPassword,
                    existingUser.password_hash
                );
                if (!passwordMatches) {
                    return res.status(401).json({ message: 'Current password is incorrect' });
                }
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

    async getMe(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }

            const user = await userController.getUserById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ success: true, data: toUserResponse(user) });
        } catch (error) {
            console.error('ERROR in getMe:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new UserManager();
