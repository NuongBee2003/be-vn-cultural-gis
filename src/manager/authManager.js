const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userController = require('../controller/UserController');

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

const toUserResponse = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    created_at: user.created_at,
});

class AuthManager {
    async register(req, res) {
        try {
            if (!secret) {
                return res.status(500).json({ message: 'JWT secret is not configured' });
            }

            const { username, email, password, avatar } = req.body || {};
            if (!username || !email || !password) {
                return res
                    .status(400)
                    .json({ message: 'username, email and password are required' });
            }

            const existingUser = await userController.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email already in use' });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const createdUser = await userController.createUser({
                username,
                email,
                password_hash: passwordHash,
                avatar,
            });

            const token = jwt.sign(
                {
                    userId: createdUser.id,
                    role: createdUser.role,
                    email: createdUser.email,
                    username: createdUser.username,
                },
                secret,
                { expiresIn }
            );

            return res.status(201).json({ token, user: toUserResponse(createdUser) });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async login(req, res) {
        try {
            if (!secret) {
                return res.status(500).json({ message: 'JWT secret is not configured' });
            }

            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ message: 'email and password are required' });
            }

            const user = await userController.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                    email: user.email,
                    username: user.username,
                },
                secret,
                { expiresIn }
            );

            return res.status(200).json({ token, user: toUserResponse(user) });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.log('ERROR: ' + error);
            const statusCode = error?.statusCode;
            if (typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500) {
                return res.status(statusCode).json({ message: error.message });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new AuthManager();
