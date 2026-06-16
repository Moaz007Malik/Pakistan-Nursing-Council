const Minio = require('minio');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.provider = config.storage.provider;
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
    } else {
      this.client = new S3Client({
        region: config.storage.aws.region,
        credentials: {
          accessKeyId: config.storage.aws.accessKeyId,
          secretAccessKey: config.storage.aws.secretAccessKey,
        },
      });
      this.bucket = config.storage.aws.bucket;
    }
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

  async upload(file, category = 'other') {
    const key = this.generateKey(file.originalname, category);

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
      storageProvider: this.provider === 'minio' ? 'minio' : 's3',
      bucket: this.bucket,
    };
  }

  async getSignedUrl(key, expirySeconds = 3600) {
    if (this.provider === 'minio') {
      return this.client.presignedGetObject(this.bucket, key, expirySeconds);
    }
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expirySeconds }
    );
  }

  async delete(key) {
    if (this.provider === 'minio') {
      await this.client.removeObject(this.bucket, key);
    } else {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    }
  }
}

module.exports = new StorageService();
