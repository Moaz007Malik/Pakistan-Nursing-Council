require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pnmc',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expire: process.env.JWT_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  storage: {
    // local = disk folder (dev/Docker only) | minio = self-hosted S3-compatible (docker-compose)
    // s3_compatible = any S3 API (Cloudflare R2, B2, DO Spaces, hosted MinIO) — no AWS account required
    // s3 = AWS S3
    provider: process.env.STORAGE_PROVIDER || 'minio',
    local: {
      uploadDir: process.env.LOCAL_STORAGE_PATH || 'uploads',
    },
    minio: {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT, 10) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
      bucket: process.env.MINIO_BUCKET || 'pnmc-documents',
    },
    s3Compatible: {
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION || process.env.AWS_REGION || 'auto',
      bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET,
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  payment: {
    // false = payments auto-complete (bypass gateways, for dev/staging)
    // true = real Stripe / Easypaisa / JazzCash must be configured
    enabled: process.env.PAYMENTS_ENABLED === 'true',
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    easypaisa: {
      merchantId: process.env.EASYPAISA_MERCHANT_ID,
      storeId: process.env.EASYPAISA_STORE_ID,
      hashKey: process.env.EASYPAISA_HASH_KEY,
    },
    jazzcash: {
      merchantId: process.env.JAZZCASH_MERCHANT_ID,
      password: process.env.JAZZCASH_PASSWORD,
      integritySalt: process.env.JAZZCASH_INTEGRITY_SALT,
    },
  },
  notification: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    smsApiKey: process.env.SMS_API_KEY,
    whatsappApiKey: process.env.WHATSAPP_API_KEY,
  },
  frontendUrl:
    process.env.FRONTEND_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  isVercel: Boolean(process.env.VERCEL),
};
