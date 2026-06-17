require('./loadEnv');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pnmc',
    dnsSrv: process.env.MONGODB_DNS_SRV !== 'false',
    dnsServers: process.env.MONGODB_DNS_SERVERS || '',
    ipv4Only: process.env.MONGODB_IPV4_ONLY === 'true',
  },
  // Deprecated: use resolveMongoUri() from ./mongodbUri for connections
  get mongodbUri() {
    return this.mongodb.uri;
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    expire: process.env.JWT_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  storage: {
    // local | cloudinary | s3_compatible | s3
    provider: process.env.STORAGE_PROVIDER
      || (process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : null)
      || 'local',
    local: {
      uploadDir: process.env.LOCAL_STORAGE_PATH || 'uploads',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
      folder: process.env.CLOUDINARY_FOLDER || 'pnmc',
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
  payment: {
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
