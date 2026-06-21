const nodemailer = require('nodemailer');

const getTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Gửi email chứa mã OTP đến người dùng
 * @param {string} toEmail - Địa chỉ email nhận
 * @param {string} otp - Mã OTP (ví dụ: 123456)
 * @returns {Promise<any>}
 */
const sendOTPEmail = async (toEmail, otp) => {
    const transporter = getTransporter();

    const mailOptions = {
        from: `"VietCultureMap" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Mã xác minh khôi phục mật khẩu - VietCultureMap',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fcfbfa;">
                <div style="text-align: center; border-bottom: 2px solid #b8922e; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #b8922e; margin: 0; font-family: 'Playfair Display', serif;">VietCultureMap</h2>
                    <p style="color: #7a5c12; font-size: 14px; margin: 5px 0 0 0;">Bản đồ Văn hóa & Du lịch Việt Nam</p>
                </div>
                
                <h3 style="color: #333333; font-size: 18px;">Yêu cầu khôi phục mật khẩu</h3>
                <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                    Chào bạn,<br/>
                    Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn trên <strong>VietCultureMap</strong>. 
                    Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc thiết lập mật khẩu mới:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; padding: 12px 30px; font-size: 24px; font-weight: bold; color: #b8922e; background-color: #f7f1e3; border: 1px dashed #b8922e; border-radius: 8px; letter-spacing: 5px; font-family: monospace;">
                        ${otp}
                    </div>
                    <p style="color: #999999; font-size: 11px; margin-top: 8px;">(Mã này có hiệu lực trong vòng 5 phút)</p>
                </div>
                
                <p style="color: #555555; font-size: 14px; line-height: 1.6;">
                    Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn được an toàn.
                </p>
                
                <div style="border-top: 1px solid #e0e0e0; margin-top: 30px; padding-top: 15px; text-align: center; font-size: 12px; color: #999999;">
                    <p style="margin: 0 0 5px 0;">&copy; 2026 VietCultureMap. All rights reserved.</p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendOTPEmail,
};
