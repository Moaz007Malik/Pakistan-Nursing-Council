const path = require('path');
const dotenv = require('dotenv');

/** Load environment from project root .env */
const ENV_PATH = path.resolve(__dirname, '../../../.env');

dotenv.config({ path: ENV_PATH });

module.exports = { ENV_PATH };
