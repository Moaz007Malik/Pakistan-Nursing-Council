process.env.NEXT_DIST_DIR = '.next';
process.env.NETLIFY = 'true';

const { execSync } = require('child_process');

execSync('npx next build', { stdio: 'inherit', env: process.env });
