const crypto = require('crypto');

function createPaymentUrl({ amount, txnRef, orderInfo, ipAddr, returnUrl }) {
  const tmnCode = process.env.VNP_TMN_CODE || '2QX15YS3';
  const secretKey = process.env.VNP_HASH_SECRET || '9U8J4E6Q2W1B5Y3X4S6A8Z1E3E2X2S2A';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  
  const date = new Date();
  // Format to YYYYMMDDHHmmss local
  const createDate = date.getFullYear() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);

  const vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = txnRef;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = Math.round(amount * 100);
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr || '127.0.0.1';
  vnp_Params['vnp_CreateDate'] = createDate;

  const sortedKeys = Object.keys(vnp_Params).sort();
  const qsParts = [];
  for (const key of sortedKeys) {
    const val = vnp_Params[key];
    if (val !== undefined && val !== null && val !== '') {
      qsParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val.toString()).replace(/%20/g, '+')}`);
    }
  }
  const signData = qsParts.join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  qsParts.push(`vnp_SecureHash=${signed}`);
  return `${vnpUrl}?${qsParts.join('&')}`;
}

function verifyReturnUrl(vnp_Params) {
  const secretKey = process.env.VNP_HASH_SECRET || '9U8J4E6Q2W1B5Y3X4S6A8Z1E3E2X2S2A';
  
  const secureHash = vnp_Params['vnp_SecureHash'];
  
  const params = { ...vnp_Params };
  delete params['vnp_SecureHash'];
  delete params['vnp_SecureHashType'];
  
  const sortedKeys = Object.keys(params).sort();
  const qsParts = [];
  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '') {
      qsParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(val.toString()).replace(/%20/g, '+')}`);
    }
  }
  const signData = qsParts.join('&');
      
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
  return secureHash === signed;
}

module.exports = {
  createPaymentUrl,
  verifyReturnUrl
};
