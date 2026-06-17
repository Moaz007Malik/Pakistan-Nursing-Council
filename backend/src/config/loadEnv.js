const path = require('path');
const dotenv = require('dotenv');

/** Always load environment from backend/.env (never repo root). */
const ENV_PATH = path.resolve(__dirname, '../../.env');

dotenv.config({ path: ENV_PATH });

module.exports = { ENV_PATH };
