const bcrypt = require('bcryptjs');
const userController = require('../controller/UserController');
const { BCRYPT_ROUNDS, toUserResponse, signAuthToken } = require('../utils/authUtils');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not set in environment variables');
}

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

class AuthManager {
    async register(req, res) {
        try {
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

            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const createdUser = await userController.createUser({
                username,
                email,
                password_hash: passwordHash,
                avatar,
            });

            const token = signAuthToken(createdUser, secret, expiresIn);

            return res.status(201).json({ token, user: toUserResponse(createdUser) });
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

    async login(req, res) {
        try {
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

            const token = signAuthToken(user, secret, expiresIn);

            return res.status(200).json({ token, user: toUserResponse(user) });
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

module.exports = new AuthManager();
