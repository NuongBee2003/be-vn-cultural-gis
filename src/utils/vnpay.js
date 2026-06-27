const { VNPay, ProductCode, VnpLocale } = require('vnpay');

const tmnCode = process.env.VNP_TMN_CODE || '2QXUI4B4';
const secureSecret = process.env.VNP_HASH_SECRET || '9U8J4E6Q2W1B5Y3X4S6A8Z1E3E2X2S2A';

let vnpayHost = 'https://sandbox.vnpayment.vn';
if (process.env.VNP_URL) {
  try {
    vnpayHost = new URL(process.env.VNP_URL).origin;
  } catch (e) {
    // fallback
  }
}

const vnpay = new VNPay({
  tmnCode,
  secureSecret,
  vnpayHost,
  testMode: true,
});

/**
 * Tạo link thanh toán VNPay
 */
function createPaymentUrl({ amount, txnRef, orderInfo, ipAddr, returnUrl }) {
  return vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(amount),
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: returnUrl,
    vnp_Locale: VnpLocale.VN,
  });
}

/**
 * Kiểm tra tính hợp lệ của chữ ký phản hồi từ VNPay
 */
function verifyReturnUrl(vnp_Params) {
  const result = vnpay.verifyReturnUrl(vnp_Params);
  return result.isVerified;
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  vnpay,
};