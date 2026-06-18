const fs = require('fs');
const path = require('path');

const targets = [
  path.join(process.cwd(), '.next'),
  path.join(process.cwd(), 'node_modules', '.cache', 'pnmc-next'),
];

for (const dir of targets) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    console.log(`Removed ${dir}`);
  } catch (error) {
    console.warn(`Could not remove ${dir}: ${error.message}`);
  }
}
