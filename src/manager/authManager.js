const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const userController = require('../controller/UserController');
const {
    BCRYPT_ROUNDS,
    toUserResponse,
    signAuthToken,
    isValidEmail,
} = require('../utils/authUtils');
const { saveOTP, getOTP, deleteOTP } = require('../utils/otpStore');
const { sendOTPEmail } = require('../utils/emailService');

const getSecret = () => process.env.JWT_SECRET;
const getExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

class AuthManager {
    async register(req, res) {
        try {
            const secret = getSecret();
            if (!secret) {
                return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
            }

            const { username, email, password, avatar, phone } = req.body || {};
            if (!username || !email || !password || !phone) {
                return res
                    .status(400)
                    .json({ message: 'Vui lòng điền đầy đủ họ tên, email, mật khẩu và số điện thoại' });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({ message: 'Email không đúng định dạng' });
            }

            // Validate phone: 10 digits starting with 0
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ message: 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0' });
            }

            const existingUser = await userController.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({ message: 'Email đã được sử dụng' });
            }

            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const createdUser = await userController.createUser({
                username,
                email,
                password_hash: passwordHash,
                avatar,
                business_phone: phone,
            });

            const token = signAuthToken(createdUser, secret, getExpiresIn());

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
            const secret = getSecret();
            if (!secret) {
                return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
            }

            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const user = await userController.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            if (user.status === 'banned') {
                return res.status(403).json({ message: 'Tài khoản của bạn bị khóa hãy gửi qua email admin : thanhdats22003@gmail.com để khiếu nại' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = signAuthToken(user, secret, getExpiresIn());

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

    async googleLogin(req, res) {
        try {
            const secret = getSecret();
            if (!secret) {
                return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is missing' });
            }

            const { token, isMock, mockEmail, mockUsername, mockAvatar } = req.body;
            let email, name, avatar;

            if (isMock) {
                email = mockEmail;
                name = mockUsername;
                avatar = mockAvatar;
            } else {
                const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
                if (!GOOGLE_CLIENT_ID) {
                    return res.status(500).json({ message: 'Google Client ID chưa được cấu hình trên Server' });
                }
                const client = new OAuth2Client(GOOGLE_CLIENT_ID);
                const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                email = payload.email;
                name = payload.name;
                avatar = payload.picture;
            }

            if (!email) {
                return res.status(400).json({ message: 'Không thể lấy email từ Google' });
            }

            let user = await userController.getUserByEmail(email);

            if (user && user.status === 'banned') {
                return res.status(403).json({ message: 'Tài khoản của bạn bị khóa hãy gửi qua email admin : thanhdats22003@gmail.com để khiếu nại' });
            }

            if (!user) {
                // Register new user via Google
                const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
                const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);
                user = await userController.createUser({
                    username: name || 'Google User',
                    email: email,
                    password_hash: passwordHash,
                    avatar: avatar,
                });
            }

            const jwtToken = signAuthToken(user, secret, getExpiresIn());

            return res.status(200).json({ token: jwtToken, user: toUserResponse(user) });
        } catch (error) {
            console.error('ERROR in googleLogin:', error);
            return res.status(401).json({ message: 'Xác thực Google thất bại' });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body || {};
            if (!email) {
                return res.status(400).json({ message: 'Email is required' });
            }

            if (!isValidEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const user = await userController.getUserByEmail(email.trim());
            if (!user) {
                return res.status(404).json({ message: 'Email address not found' });
            }

            // Generate a random 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Save to Redis / Store
            await saveOTP(email, otp);

            // Send Email
            await sendOTPEmail(email, otp);

            return res.status(200).json({ success: true, message: 'OTP sent successfully' });
        } catch (error) {
            console.error('ERROR in forgotPassword:', error);
            return res.status(500).json({ message: 'Failed to send OTP. Please try again later.' });
        }
    }

    async resetPassword(req, res) {
        try {
            const { email, otp, newPassword } = req.body || {};
            if (!email || !otp || !newPassword) {
                return res.status(400).json({ message: 'Email, OTP, and new password are required' });
            }

            const cachedOtp = await getOTP(email);
            if (!cachedOtp || cachedOtp !== String(otp).trim()) {
                return res.status(400).json({ message: 'Mã xác thực OTP không hợp lệ hoặc đã hết hạn.' });
            }

            const user = await userController.getUserByEmail(email.trim());
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Hash password and update user
            const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
            await userController.updateUser(user.id, { password_hash: passwordHash });

            // Delete OTP from cache
            await deleteOTP(email);

            return res.status(200).json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
        } catch (error) {
            console.error('ERROR in resetPassword:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new AuthManager();
