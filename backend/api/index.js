const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serverless = require('serverless-http');
const app = require('../src/app');

module.exports = serverless(app, {
  binary: ['multipart/*', 'application/pdf', 'image/*'],
});
