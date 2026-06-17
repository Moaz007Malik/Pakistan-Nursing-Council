#!/usr/bin/env node
/**
 * One-time helper: resolve Atlas SRV → standard mongodb:// URI for production.
 * Copy the output into MONGODB_URI_DIRECT on Vercel/Render.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { resolveMongoUri } = require('../src/config/mongodbUri');

resolveMongoUri({ allowSrvConversion: true })
  .then(({ uri, source }) => {
    console.log(`\nResolved via: ${source}\n`);
    console.log('Add this to your host environment variables:\n');
    console.log(`MONGODB_URI_DIRECT=${uri}`);
    console.log('MONGODB_DNS_SRV=false\n');
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
