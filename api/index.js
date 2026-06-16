const serverless = require('serverless-http');
const connectDB = require('../backend/src/config/database');
const app = require('../backend/src/app');

let isConnected = false;
let handler;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  if (!handler) {
    handler = serverless(app, { binary: ['multipart/*', 'application/pdf', 'image/*'] });
  }
  return handler(req, res);
};
