const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.provider = config.storage.provider;

    if (this.provider === 'local') {
      this.uploadDir = path.resolve(config.storage.local.uploadDir);
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`Storage: local disk at ${this.uploadDir}`);
      return;
    }

    const s3Config = this.provider === 's3'
      ? config.storage.aws
      : config.storage.s3Compatible;

    const clientOptions = {
      region: s3Config.region || 'auto',
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    };

    if (s3Config.endpoint) {
      clientOptions.endpoint = s3Config.endpoint;
      clientOptions.forcePathStyle = s3Config.forcePathStyle !== false;
    }

    this.client = new S3Client(clientOptions);
    this.bucket = s3Config.bucket;
    logger.info(`Storage: ${this.provider} (${this.bucket || 'no bucket configured'})`);
  }

  generateKey(filename, category) {
    const ext = filename.split('.').pop();
    return `${category}/${new Date().getFullYear()}/${uuidv4()}.${ext}`;
  }

  storageProviderLabel() {
    return this.provider === 'local' ? 'local' : 's3';
  }

  async upload(file, category = 'other') {
    const key = this.generateKey(file.originalname, category);

    if (this.provider === 'local') {
      const filePath = path.join(this.uploadDir, key);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, file.buffer);
      return {
        storageKey: key,
        storageProvider: 'local',
        bucket: this.uploadDir,
      };
    }

    if (!this.bucket || !this.client) {
      throw new Error('Cloud storage is not configured. Set S3_* env vars or use STORAGE_PROVIDER=local');
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      storageKey: key,
      storageProvider: 's3',
      bucket: this.bucket,
    };
  }

  async getSignedUrl(key, expirySeconds = 3600) {
    if (this.provider === 'local') return null;

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expirySeconds }
    );
  }

  getLocalFilePath(key) {
    return path.join(this.uploadDir, key);
  }

  async delete(key) {
    if (this.provider === 'local') {
      const filePath = this.getLocalFilePath(key);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return;
    }

    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

module.exports = new StorageService();
