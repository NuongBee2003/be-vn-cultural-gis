const redisClient = require('../config/redisClient');

// Bộ lưu trữ in-memory đề phòng trường hợp Redis không hoạt động
const memoryStore = new Map();

/**
 * Lưu mã OTP với thời hạn hết hạn (TTL = 300 giây = 5 phút)
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<boolean>}
 */
const saveOTP = async (email, otp) => {
    const key = `otp:${email.toLowerCase().trim()}`;
    const ttl = 300; // 5 phút

    // Thử lưu vào Redis
    try {
        if (redisClient.isOpen) {
            await redisClient.setEx(key, ttl, otp);
            return true;
        }
    } catch (err) {
        console.error('Lỗi khi lưu OTP vào Redis, chuyển sang lưu Memory:', err);
    }

    // Fallback lưu vào RAM
    const expiresAt = Date.now() + ttl * 1000;
    memoryStore.set(key, { otp, expiresAt });
    return true;
};

/**
 * Lấy mã OTP của email
 * @param {string} email
 * @returns {Promise<string|null>}
 */
const getOTP = async (email) => {
    const key = `otp:${email.toLowerCase().trim()}`;

    // Thử lấy từ Redis
    try {
        if (redisClient.isOpen) {
            const cachedOtp = await redisClient.get(key);
            return cachedOtp || null;
        }
    } catch (err) {
        console.error('Lỗi khi lấy OTP từ Redis, chuyển sang lấy Memory:', err);
    }

    // Fallback lấy từ RAM
    const item = memoryStore.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
        memoryStore.delete(key); // Xóa nếu hết hạn
        return null;
    }

    return item.otp;
};

/**
 * Xóa mã OTP sau khi sử dụng thành công
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const deleteOTP = async (email) => {
    const key = `otp:${email.toLowerCase().trim()}`;

    // Xóa trong Redis
    try {
        if (redisClient.isOpen) {
            await redisClient.del(key);
            return true;
        }
    } catch (err) {
        console.error('Lỗi khi xóa OTP trong Redis, chuyển sang xóa Memory:', err);
    }

    // Xóa trong RAM
    return memoryStore.delete(key);
};

module.exports = {
    saveOTP,
    getOTP,
    deleteOTP,
};
