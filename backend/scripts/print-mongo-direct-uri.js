#!/usr/bin/env node
/**
 * Prints the Atlas standard (non-SRV) MongoDB URI for Vercel.
 * Copy the output into Vercel → MONGODB_URI_DIRECT
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { resolveMongoUri } = require('../src/config/mongodbUri');

resolveMongoUri({ forceDirect: true })
  .then((uri) => {
    console.log('\nAdd this to Vercel Environment Variables:\n');
    console.log(`MONGODB_URI_DIRECT=${uri}`);
    console.log('\nAlso set: MONGODB_DNS_SRV=false\n');
  })
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
