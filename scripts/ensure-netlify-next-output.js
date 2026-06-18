const fs = require('fs');
const path = require('path');

const root = process.cwd();
const nextDir = path.join(root, '.next');
const cacheDir = path.join(root, 'node_modules', '.cache', 'pnmc-next');

const hasBuildOutput = (dir) => (
  fs.existsSync(path.join(dir, 'BUILD_ID'))
  || fs.existsSync(path.join(dir, 'server'))
);

if (hasBuildOutput(nextDir)) {
  console.log('Netlify: .next already contains build output');
  process.exit(0);
}

if (!hasBuildOutput(cacheDir)) {
  console.error('Netlify: no Next.js build output found in .next or node_modules/.cache/pnmc-next');
  process.exit(1);
}

fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
fs.cpSync(cacheDir, nextDir, { recursive: true });
console.log('Netlify: copied build output to .next');
