// src/config/payment.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  momo: {
    phone: process.env.MOMO_PHONE || '0987654321',
    name: process.env.MOMO_NAME || 'RENTMATE',
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMOXAAI20240101',
    accessKey: process.env.MOMO_ACCESS_KEY || 'YOUR_ACCESS_KEY',
    secretKey: process.env.MOMO_SECRET_KEY || 'YOUR_SECRET_KEY',
  },
  vnpay: {
    account: process.env.VNPAY_ACCOUNT || '1234567890',
    bank: process.env.VNPAY_BANK || 'VIETCOMBANK',
    name: process.env.VNPAY_NAME || 'RENTMATE',
    tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/deposit/webhook/vnpay',
    ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/deposit/webhook/vnpay',
  },
  bank: {
    account: process.env.BANK_ACCOUNT || '9876543210',
    name: process.env.BANK_NAME || 'TECHCOMBANK',
    holder: process.env.BANK_HOLDER || 'RENTMATE',
    branch: process.env.BANK_BRANCH || 'Chi nhánh TP.HCM',
  },
  qr: {
    expireMinutes: parseInt(process.env.QR_EXPIRE_MINUTES || '30', 10),
    imageFormat: process.env.QR_IMAGE_FORMAT || 'png',
    size: parseInt(process.env.QR_SIZE || '300', 10),
  },
  contract: {
    expireMinutes: parseInt(process.env.CONTRACT_EXPIRE_MINUTES || '30', 10),
    pdfDir: process.env.CONTRACT_PDF_DIR || './uploads/contracts',
    pdfUrl: process.env.CONTRACT_PDF_URL || 'http://localhost:3000/uploads/contracts',
  },
  limits: {
    minDepositAmount: parseInt(process.env.MIN_DEPOSIT_AMOUNT || '100000', 10),
    maxDepositAmount: parseInt(process.env.MAX_DEPOSIT_AMOUNT || '100000000', 10),
    defaultDepositMonths: parseInt(process.env.DEFAULT_DEPOSIT_MONTHS || '2', 10),
  },
}));