/** @type {import('next').NextConfig} */
// OneDrive locks `.next` on Windows — use alternate distDir for local builds only.
// Netlify builds (NETLIFY=true) and cloud CI must use the default `.next` output.
const isOneDrivePath = /OneDrive/i.test(process.cwd());
const isNetlifyBuild = Boolean(process.env.NETLIFY || process.env.NETLIFY_DEV);
const useAltDist = isOneDrivePath && !isNetlifyBuild && !process.env.NEXT_DIST_DIR;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
  ...(useAltDist && {
    distDir: 'node_modules/.cache/pnmc-next',
  }),
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
