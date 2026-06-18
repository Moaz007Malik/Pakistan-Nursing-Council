/** @type {import('next').NextConfig} */
// OneDrive locks `.next` on Windows — use alternate distDir for local builds only.
// Netlify builds (NETLIFY=true) and cloud CI must use the default `.next` output.
const isOneDrivePath = /OneDrive/i.test(process.cwd());
const isNetlifyBuild = Boolean(
  process.env.NETLIFY
  || process.env.NETLIFY_DEV
  || process.env.NEXT_DIST_DIR === '.next',
);
const useAltDist = isOneDrivePath && !isNetlifyBuild;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
  distDir: process.env.NEXT_DIST_DIR || (useAltDist ? 'node_modules/.cache/pnmc-next' : '.next'),
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { dev }) => {
    if (dev || isOneDrivePath) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
