/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
  // OneDrive/Windows often corrupts .next/cache/webpack/*.pack.gz — disable dev disk cache
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
