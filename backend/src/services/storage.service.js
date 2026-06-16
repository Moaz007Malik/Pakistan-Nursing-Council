const fs = require('fs');
const path = require('path');
const Minio = require('minio');
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

    if (this.provider === 'minio') {
      this.client = new Minio.Client({
        endPoint: config.storage.minio.endPoint,
        port: config.storage.minio.port,
        useSSL: config.storage.minio.useSSL,
        accessKey: config.storage.minio.accessKey,
        secretKey: config.storage.minio.secretKey,
      });
      this.bucket = config.storage.minio.bucket;
      this.ensureBucket();
      logger.info(`Storage: MinIO at ${config.storage.minio.endPoint}:${config.storage.minio.port}`);
      return;
    }

    if (this.provider === 's3_compatible') {
      const s3c = config.storage.s3Compatible;
      this.client = new S3Client({
        region: s3c.region,
        endpoint: s3c.endpoint,
        credentials: {
          accessKeyId: s3c.accessKeyId,
          secretAccessKey: s3c.secretAccessKey,
        },
        forcePathStyle: s3c.forcePathStyle,
      });
      this.bucket = s3c.bucket;
      logger.info(`Storage: S3-compatible at ${s3c.endpoint}`);
      return;
    }

    // AWS S3
    this.client = new S3Client({
      region: config.storage.aws.region,
      credentials: {
        accessKeyId: config.storage.aws.accessKeyId,
        secretAccessKey: config.storage.aws.secretAccessKey,
      },
    });
    this.bucket = config.storage.aws.bucket;
    logger.info('Storage: AWS S3');
  }

  async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        logger.info(`Created bucket: ${this.bucket}`);
      }
    } catch (err) {
      logger.warn(`Bucket check failed: ${err.message}`);
    }
  }

  generateKey(filename, category) {
    const ext = filename.split('.').pop();
    return `${category}/${new Date().getFullYear()}/${uuidv4()}.${ext}`;
  }

  storageProviderLabel() {
    if (this.provider === 'local') return 'local';
    if (this.provider === 'minio') return 'minio';
    if (this.provider === 's3_compatible') return 's3';
    return 's3';
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

    if (this.provider === 'minio') {
      await this.client.putObject(this.bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
    } else {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );
    }

    return {
      storageKey: key,
      storageProvider: this.storageProviderLabel(),
      bucket: this.bucket,
    };
  }

  async getSignedUrl(key, expirySeconds = 3600) {
    if (this.provider === 'local') {
      return null;
    }
    if (this.provider === 'minio') {
      return this.client.presignedGetObject(this.bucket, key, expirySeconds);
    }
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
    if (this.provider === 'minio') {
      await this.client.removeObject(this.bucket, key);
    } else {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
  }
}

module.exports = new StorageService();
